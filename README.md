# WikiCartes

Clone de jeu de collection de cartes Wikipédia, issu de la version 24 du projet Sites **WikiCartes** (anciennement Atlas), source `d3edd7f4ac790e670c80d0d8c4cd9127475b419c`.

Ce dépôt contient les sources du jeu, les migrations SQL, les outils d’import et leurs essais. Le catalogue et les données des joueurs restent dans la base du site existant ; aucune copie de cette base ni aucun secret n’est publié ici.

Le jeu existant : https://wikicartes.emmanuel-galland117.chatgpt.site

## Prérequis et configuration

- Node.js 22.13 ou plus récent et npm.
- Un runtime Cloudflare Workers avec une base D1 liée sous le nom `DB` ; `.openai/hosting.json` conserve cette déclaration logique, sans l’identifiant du projet d’origine.
- Renseigner `WIKICARTES_ADMIN_EMAIL` dans le runtime pour autoriser l’administration. Aucun compte administrateur personnel n’est défini dans le code public.
- Appliquer les migrations SQL de `drizzle/` dans l’ordre à une base neuve. Pour une base existante, conserver son historique de migrations et tenir compte du reset V6 décrit ci-dessous.
- L’authentification de production dépend des en-têtes de confiance fournis par Sites. Le profil portable propose une identité de développement simulée. Un autre hébergeur nécessite une intégration d’authentification adaptée avant toute ouverture publique.

Cette application utilise une API serveur et une base D1 : elle ne fonctionne pas telle quelle sur GitHub Pages.

## Vérifications disponibles

```sh
node scripts/test-wiki-csv.mjs
python3 scripts/test_historical_views.py
```

Jeu de cartes illustrées à partir d'articles de Wikipédia en français, réalisé avec Vinext, TypeScript et D1. Le catalogue est rempli depuis l'administration ; aucun lot de cartes initiales n'est réinséré automatiquement.

## Fonctionnement

- `npm ci` puis `npm run dev` pour le développement portable ; sur Sites, utilisez le profil d'exécution prévu.
- `npm run db:generate` après toute modification de `db/schema.ts`.
- Appliquer les migrations du dossier `drizzle/` à la base locale avant un aperçu avec D1.
- Les articles sont indexés par lots de 50 depuis l'administration. Seuls ceux dotés d'une image réutilisable et, pour les nouvelles cartes, d'au moins 100 vues sur les 30 derniers jours sont enregistrés. Le seuil est réglable dans l'administration ; il ne retire pas les cartes déjà validées.
- La V6 remet une fois les données du jeu à zéro lors du premier accès après publication. Elle conserve l'identité des comptes, mais efface les cartes, collections, historiques et progressions. La clé `v6_reset_completed` dans `config` empêche toute répétition de ce reset.
- Les comptes, collections, réglages, échanges et enchères sont enregistrés dans D1. L'identité est fournie par Sites ; aucun mot de passe ne transite dans l'application.

L'import massif du catalogue d'articles Wikipédia est disponible dans l'administration. La connexion Google indépendante de ChatGPT n'est pas implémentée. Les échanges entre joueurs nécessitent un accès partagé au même serveur et à la même base de données.

## Vues historiques des cartes

1. Dans **Administration → Vues historiques**, cliquer sur **Exporter les cartes existantes**. L'export CSV contient seulement les cartes déjà créées dans WikiCartes, avec leur identifiant, leur titre et leur URL Wikipédia. **Exporter les cartes à compléter** permet plus tard de traiter uniquement celles qui n'ont pas encore de cumul.
2. Télécharger `wikicartes_historical_views.py` dans le même dossier que le CSV. Lancer `python wikicartes_historical_views.py wikicartes-cartes-existantes.csv` (sous Windows, `py wikicartes_historical_views.py wikicartes-cartes-existantes.csv` convient aussi). La bibliothèque standard Python suffit. Pour un essai limité : ajouter `--limit 10`.
3. Le script écrit un fichier `.historique.sqlite` de reprise et un CSV `.vues-historiques.csv` à côté du fichier exporté. Il traite les mois complets de juillet 2015 au dernier mois complet, en série, respecte les demandes de ralentissement de Wikimedia et affiche le nombre traité ainsi que le temps estimé. Relancer la même commande reprend après une interruption. Conserver le CSV source et le fichier SQLite tant que le traitement n'est pas fini.
4. Cliquer sur **Importer les vues historiques** et choisir le fichier `.vues-historiques.csv`. Les totaux sont importés par lots ; réimporter le même fichier reprend sans doubler les vues. Les données du dernier mois sont conservées séparément. La rareté reste calculée avec les vues mensuelles jusqu'à la définition de nouveaux seuils historiques.

Le cumul porte sur le titre actuel de la page Wikipédia ; les vues sous d'anciens titres, avant un renommage, ne sont pas fusionnées automatiquement. À cadence d'une requête par seconde, un catalogue de 100 000 cartes demande au moins 28 heures, hors latence et ralentissements demandés par l'API.
