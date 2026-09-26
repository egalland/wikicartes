# Atlas

Jeu de cartes illustrées à partir d'articles de Wikipédia. La V2 utilise Vinext, TypeScript, D1 et l'identité ChatGPT fournie par Sites. Le catalogue initial (`public/catalog.json`) est constitué de 102 articles dont l'image a une licence libre ou relève du domaine public ; `enrich_catalog.py` documente la vérification réalisée pour ce lot.

## Fonctionnement

- `npm ci` puis `npm run dev` pour le développement portable ; sur Sites, utilisez le profil d'exécution prévu.
- `npm run db:generate` après toute modification de `db/schema.ts`.
- Appliquer les migrations du dossier `drizzle/` à la base locale avant un aperçu avec D1.
- Les nouvelles familles sont indexées par tranches de 50 articles directs via l'interface super administrateur. Seuls les articles dotés d'une image à licence réutilisable sont enregistrés.
- Les comptes, collections, réglages, échanges et enchères sont enregistrés dans D1. L'identité est fournie par Sites ; aucun mot de passe ne transite dans l'application.

L'indexation de toute Wikipédia et la connexion Google indépendante de ChatGPT ne sont pas encore implémentées. Le site reste privé pendant les essais ; les échanges entre joueurs nécessitent ensuite l'ouverture contrôlée de l'accès.
