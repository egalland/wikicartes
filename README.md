# Atlas

Jeu de cartes illustrées à partir d'articles de Wikipédia en français, réalisé avec Vinext, TypeScript et D1. Le catalogue est rempli depuis l'administration ; aucun lot de cartes initiales n'est réinséré automatiquement.

## Fonctionnement

- `npm ci` puis `npm run dev` pour le développement portable ; sur Sites, utilisez le profil d'exécution prévu.
- `npm run db:generate` après toute modification de `db/schema.ts`.
- Appliquer les migrations du dossier `drizzle/` à la base locale avant un aperçu avec D1.
- Les articles sont indexés par lots de 50 depuis l'administration. Seuls ceux dotés d'une image réutilisable et, pour les nouvelles cartes, d'au moins 100 vues sur les 30 derniers jours sont enregistrés. Le seuil est réglable dans l'administration ; il ne retire pas les cartes déjà validées.
- La V6 remet une fois les données du jeu à zéro lors du premier accès après publication. Elle conserve l'identité des comptes, mais efface les cartes, collections, historiques et progressions. La clé `v6_reset_completed` dans `config` empêche toute répétition de ce reset.
- Les comptes, collections, réglages, échanges et enchères sont enregistrés dans D1. L'identité est fournie par Sites ; aucun mot de passe ne transite dans l'application.

L'indexation de toute Wikipédia et la connexion Google indépendante de ChatGPT ne sont pas encore implémentées. Le site reste privé pendant les essais ; les échanges entre joueurs nécessitent ensuite l'ouverture contrôlée de l'accès.
