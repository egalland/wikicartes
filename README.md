# WikiCartes

Jeu de cartes illustrées à partir d'articles de Wikipédia en français, réalisé avec Vinext, TypeScript et D1. Le catalogue est rempli depuis l'administration ; aucun lot de cartes initiales n'est réinséré automatiquement.

## Fonctionnement

- `npm ci` puis `npm run dev` pour le développement portable ; sur Sites, utilisez le profil d'exécution prévu.
- `npm run db:generate` après toute modification de `db/schema.ts`.
- Appliquer les migrations du dossier `drizzle/` à la base locale avant un aperçu avec D1.
- Les articles sont indexés par lots de 50 depuis l'administration. Seuls ceux dotés d'une image réutilisable et, pour les nouvelles cartes, d'au moins 100 vues sur les 30 derniers jours sont enregistrés. Le seuil est réglable dans l'administration ; il ne retire pas les cartes déjà validées.
- La V6 remet une fois les données du jeu à zéro lors du premier accès après publication. Elle conserve l'identité des comptes, mais efface les cartes, collections, historiques et progressions. La clé `v6_reset_completed` dans `config` empêche toute répétition de ce reset.
- Les comptes, collections, réglages, échanges et enchères sont enregistrés dans D1. L'identité est fournie par Sites ; aucun mot de passe ne transite dans l'application.

L'import massif du catalogue d'articles Wikipédia est disponible dans l'administration. La connexion Google indépendante de ChatGPT n'est pas implémentée. Le site reste privé pendant les essais ; les échanges entre joueurs nécessitent ensuite l'ouverture contrôlée de l'accès.

## Vues historiques des cartes

1. Dans **Administration → Vues historiques**, cliquer sur **Exporter les cartes existantes**. L'export CSV contient seulement les cartes déjà créées dans WikiCartes, avec leur identifiant, leur titre et leur URL Wikipédia. **Exporter les cartes à compléter** permet plus tard de traiter uniquement celles qui n'ont pas encore de cumul.
2. Télécharger `wikicartes_historical_views.py` dans le même dossier que le CSV. Lancer `python wikicartes_historical_views.py wikicartes-cartes-existantes.csv` (sous Windows, `py wikicartes_historical_views.py wikicartes-cartes-existantes.csv` convient aussi). La bibliothèque standard Python suffit. Pour un essai limité : ajouter `--limit 10`.
3. Le script écrit un fichier `.historique.sqlite` de reprise et un CSV `.vues-historiques.csv` à côté du fichier exporté. Il traite les mois complets de juillet 2015 au dernier mois complet, en série, respecte les demandes de ralentissement de Wikimedia et affiche le nombre traité ainsi que le temps estimé. Relancer la même commande reprend après une interruption. Conserver le CSV source et le fichier SQLite tant que le traitement n'est pas fini.
4. Cliquer sur **Importer les vues historiques** et choisir le fichier `.vues-historiques.csv`. Les totaux sont importés par lots ; réimporter le même fichier reprend sans doubler les vues. Les données du dernier mois sont conservées séparément. La rareté reste calculée avec les vues mensuelles jusqu'à la définition de nouveaux seuils historiques.

Le cumul porte sur le titre actuel de la page Wikipédia ; les vues sous d'anciens titres, avant un renommage, ne sont pas fusionnées automatiquement. À cadence d'une requête par seconde, un catalogue de 100 000 cartes demande au moins 28 heures, hors latence et ralentissements demandés par l'API.
