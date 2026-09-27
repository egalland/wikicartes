"""Essai hors ligne du calcul, des réponses API et de la reprise."""

import argparse
import csv
import importlib.util
import io
import json
import sqlite3
import tempfile
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "public" / "atlas_historical_views.py"
spec = importlib.util.spec_from_file_location("atlas_historical_views", SCRIPT)
historical = importlib.util.module_from_spec(spec)
spec.loader.exec_module(historical)


class Response:
    def __init__(self, data):
        self.data = io.BytesIO(json.dumps(data).encode())

    def __enter__(self):
        return self.data

    def __exit__(self, *_):
        self.data.close()


class HistoricalViewsTest(unittest.TestCase):
    def test_export_csv_progress_resume_and_retry(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            source = folder / "atlas-cartes-existantes.csv"
            with source.open("w", newline="", encoding="utf-8") as stream:
                writer = csv.writer(stream)
                writer.writerow(("card_id", "title", "wikipedia_url"))
                writer.writerows(((10, "Tour Eiffel", "https://fr.wikipedia.org/wiki/Tour_Eiffel"),
                                 (20, "Été, 2025", "https://fr.wikipedia.org/wiki/%C3%89t%C3%A9"),
                                 (30, "Page absente", "https://fr.wikipedia.org/wiki/Page_absente")))
            seen = []

            def get(request, timeout):
                seen.append(request.full_url)
                if "Page_absente" in request.full_url:
                    raise urllib.error.HTTPError(request.full_url, 404, "not found", {}, None)
                if "Tour_Eiffel" in request.full_url and sum("Tour_Eiffel" in url for url in seen) == 1:
                    raise urllib.error.HTTPError(request.full_url, 429, "slow down", {"Retry-After": "0"}, None)
                return Response({"items": [{"views": 12}, {"views": 30}]})

            args = argparse.Namespace(input=source, output=folder / "result.csv", checkpoint=folder / "state.sqlite",
                                      start="2015-07", end=historical.last_complete_month(), agent="user",
                                      contact=historical.CONTACT, delay=0.5, retries=2, limit=2)
            with patch.object(historical.urllib.request, "urlopen", side_effect=get), patch.object(historical.time, "sleep"):
                historical.run(args)
                self.assertEqual(len(seen), 3)
                args.limit = None
                historical.run(args)
                self.assertEqual(len(seen), 4)
            with args.output.open(encoding="utf-8-sig", newline="") as stream:
                rows = list(csv.DictReader(stream))
            self.assertEqual([row["views_total"] for row in rows], ["42", "42", "0"])
            self.assertEqual([row["status"] for row in rows], ["ok", "ok", "no_data"])
            self.assertEqual(rows[1]["title"], "Été, 2025")
            self.assertIn("%C3%89t%C3%A9%2C_2025", seen[2])
            source.write_text(source.read_text(encoding="utf-8") + "40,Nouvelle,https://fr.wikipedia.org/wiki/Nouvelle\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "CSV ou la période a changé"):
                historical.run(args)
            with sqlite3.connect(args.checkpoint) as connection:
                self.assertEqual(connection.execute("SELECT COUNT(*) FROM results").fetchone()[0], 3)


if __name__ == "__main__":
    unittest.main()
