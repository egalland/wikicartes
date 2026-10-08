#!/usr/bin/env python3
"""Calcule les vues mensuelles historiques des cartes exportées par WikiCartes.

Usage : python wikicartes_historical_views.py wikicartes-cartes-existantes.csv
La sortie et le journal SQLite sont créés à côté du CSV. Relancer la même
commande reprend le travail sans refaire les articles déjà traités.
"""

import argparse
import csv
import datetime as dt
import email.utils
import hashlib
import json
import sqlite3
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/fr.wikipedia.org/all-access"
START = "2015-07"
CONTACT = "https://wikicartes.emmanuel-galland117.chatgpt.site"
FIELDS = ("card_id", "title", "wikipedia_url", "views_total", "period_start", "period_end", "status", "error")


class ApiError(Exception):
    def __init__(self, message, retry_after=None, transient=False):
        super().__init__(message)
        self.retry_after = retry_after
        self.transient = transient


def month(value):
    try:
        parsed = dt.datetime.strptime(value, "%Y-%m")
        if parsed.strftime("%Y-%m") != value:
            raise ValueError()
        return value
    except ValueError as exc:
        raise argparse.ArgumentTypeError("Date attendue : AAAA-MM") from exc


def last_complete_month():
    first = dt.datetime.now(dt.timezone.utc).date().replace(day=1)
    return (first - dt.timedelta(days=1)).strftime("%Y-%m")


def input_digest(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def read_cards(path):
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if reader.fieldnames != ["card_id", "title", "wikipedia_url"]:
            raise ValueError("Colonnes attendues : card_id,title,wikipedia_url (export WikiCartes).")
        cards = []
        seen = set()
        for line, row in enumerate(reader, 2):
            if None in row or any(value is None for value in row.values()):
                raise ValueError(f"Ligne {line} : CSV invalide.")
            raw_id, title = row["card_id"].strip(), row["title"].strip()
            if not raw_id.isdecimal() or int(raw_id) < 1 or not title or len(title) > 300:
                raise ValueError(f"Ligne {line} : identifiant ou titre invalide.")
            url = urllib.parse.urlsplit(row["wikipedia_url"])
            if url.scheme != "https" or url.netloc != "fr.wikipedia.org" or not url.path.startswith("/wiki/"):
                raise ValueError(f"Ligne {line} : URL Wikipédia invalide.")
            if int(raw_id) in seen:
                raise ValueError(f"Ligne {line} : identifiant en double.")
            seen.add(int(raw_id))
            cards.append((int(raw_id), title, row["wikipedia_url"]))
    return cards


def retry_after(value):
    if not value:
        return None
    try:
        return max(0.0, float(value))
    except ValueError:
        try:
            date = email.utils.parsedate_to_datetime(value)
            return max(0.0, (date - dt.datetime.now(dt.timezone.utc)).total_seconds())
        except (TypeError, ValueError, OverflowError):
            return None


def fetch_views(title, start, end, agent, user_agent, delay, retries):
    slug = urllib.parse.quote(title.replace(" ", "_"), safe="")
    url = f"{API}/{agent}/{slug}/monthly/{start.replace('-', '')}0100/{end.replace('-', '')}0100"
    for attempt in range(retries + 1):
        request = urllib.request.Request(url, headers={"User-Agent": user_agent, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(request, timeout=35) as response:
                data = json.load(response)
            items = data.get("items")
            if not isinstance(items, list) or any(not isinstance(item, dict) or not isinstance(item.get("views"), int) or item["views"] < 0 for item in items):
                raise ApiError("Réponse API inattendue.")
            return sum(item["views"] for item in items), "ok"
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                return 0, "no_data"
            error = ApiError(f"HTTP {exc.code}", retry_after(exc.headers.get("Retry-After")), exc.code in (408, 429, 500, 502, 503, 504))
        except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError) as exc:
            error = ApiError(str(exc)[:140], transient=True)
        if not error.transient or attempt == retries:
            raise error
        wait = max(error.retry_after or 0, min(60, delay * 2 ** (attempt + 1)))
        print(f"  {title[:50]} : {error}, nouvelle tentative dans {wait:.0f} s", flush=True)
        time.sleep(wait)


def save_csv(connection, destination):
    temporary = destination.with_name(destination.name + ".tmp")
    with temporary.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.writer(stream)
        writer.writerow(FIELDS)
        writer.writerows(connection.execute("SELECT card_id,title,wikipedia_url,views_total,period_start,period_end,status,error FROM results ORDER BY card_id"))
    temporary.replace(destination)


def run(args):
    if args.delay < 0.5:
        raise ValueError("Le délai minimal est de 0,5 seconde entre les requêtes.")
    source = args.input.resolve()
    cards = read_cards(source)
    fingerprint = input_digest(source)
    checkpoint = args.checkpoint or source.with_name(source.stem + ".historique.sqlite")
    output = args.output or source.with_name(source.stem + ".vues-historiques.csv")
    user_agent = f"WikiCartesHistoricalViews/1.0 ({args.contact}) Python-urllib"
    connection = sqlite3.connect(checkpoint)
    try:
        connection.execute("CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        connection.execute("CREATE TABLE IF NOT EXISTS results (card_id INTEGER PRIMARY KEY, title TEXT NOT NULL, wikipedia_url TEXT NOT NULL, views_total INTEGER, period_start TEXT NOT NULL, period_end TEXT NOT NULL, status TEXT NOT NULL, error TEXT NOT NULL)")
        metadata = dict(connection.execute("SELECT key,value FROM metadata"))
        args.end = args.end or metadata.get("end") or last_complete_month()
        if args.start < START or args.end < args.start or args.end > last_complete_month():
            raise ValueError(f"Période invalide : entre {START} et {last_complete_month()}, mois complets seulement.")
        expected = {"sha256": fingerprint, "start": args.start, "end": args.end, "agent": args.agent}
        if metadata and metadata != expected:
            raise ValueError("Le CSV ou la période a changé. Utilise un autre --checkpoint (et --output), ou reprends avec les mêmes paramètres.")
        if not metadata:
            connection.executemany("INSERT INTO metadata VALUES (?,?)", expected.items())
            connection.commit()
        finished = {row[0] for row in connection.execute("SELECT card_id FROM results WHERE status IN ('ok','no_data')")}
        pending = [(card_id, title, url) for card_id, title, url in cards if card_id not in finished]
        if args.limit is not None:
            pending = pending[:args.limit]
        print(f"{len(cards):,} cartes · {len(finished):,} déjà traitées · {len(pending):,} à traiter · {args.start} → {args.end}", flush=True)
        started = time.monotonic()
        done = 0
        try:
            for card_id, title, wikipedia_url in pending:
                try:
                    total, status = fetch_views(title, args.start, args.end, args.agent, user_agent, args.delay, args.retries)
                    error = ""
                except ApiError as exc:
                    if str(exc) in ("HTTP 401", "HTTP 403"):
                        raise RuntimeError(f"API refusée ({exc}). Vérifie le User-Agent et l’accès avant de reprendre.") from exc
                    total, status, error = None, "error", str(exc).replace("\r", " ").replace("\n", " ")[:180]
                connection.execute("INSERT INTO results VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(card_id) DO UPDATE SET title=excluded.title,wikipedia_url=excluded.wikipedia_url,views_total=excluded.views_total,period_start=excluded.period_start,period_end=excluded.period_end,status=excluded.status,error=excluded.error", (card_id, title, wikipedia_url, total, args.start, args.end, status, error))
                connection.commit()
                done += 1
                if done % 10 == 0 or done == len(pending):
                    elapsed = max(time.monotonic() - started, 0.1)
                    eta = (len(pending) - done) * elapsed / done
                    print(f"{len(finished)+done:,}/{len(cards):,} · {100*(len(finished)+done)/max(len(cards),1):.1f}% · erreurs {connection.execute('SELECT COUNT(*) FROM results WHERE status=?', ('error',)).fetchone()[0]} · reste ≈ {eta/3600:.1f} h", flush=True)
                if done < len(pending):
                    time.sleep(args.delay)
        except KeyboardInterrupt:
            print("\nPause. Relance la même commande pour reprendre.", flush=True)
        finally:
            save_csv(connection, output)
            print(f"CSV disponible : {output}", flush=True)
    finally:
        connection.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="CSV exporté depuis l’administration de WikiCartes")
    parser.add_argument("--output", type=Path, help="CSV des totaux à réimporter dans WikiCartes")
    parser.add_argument("--checkpoint", type=Path, help="Fichier SQLite de reprise")
    parser.add_argument("--start", type=month, default=START, help="Mois initial (défaut : 2015-07)")
    parser.add_argument("--end", type=month, help="Dernier mois complet (figé à la première exécution)")
    parser.add_argument("--agent", choices=("user", "all-agents"), default="user", help="Vues humaines par défaut")
    parser.add_argument("--contact", default=CONTACT, help="Page web ou courriel de contact pour Wikimedia")
    parser.add_argument("--delay", type=float, default=1.0, help="Pause entre requêtes, minimum 0,5 s")
    parser.add_argument("--retries", type=int, default=5, help="Tentatives supplémentaires pour erreurs temporaires")
    parser.add_argument("--limit", type=int, help="Limiter le nombre de cartes pour un essai")
    args = parser.parse_args()
    if args.limit is not None and args.limit < 1 or args.retries < 0 or args.retries > 10:
        parser.error("--limit doit être positif ; --retries entre 0 et 10.")
    try:
        run(args)
    except (ValueError, OSError, RuntimeError, sqlite3.Error) as exc:
        parser.exit(1, f"Erreur : {exc}\n")


if __name__ == "__main__":
    main()
