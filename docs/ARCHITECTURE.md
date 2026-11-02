# Architecture

Monolithe modulaire Next.js, export statique en V0.1. Le JSON public est lu derrière `modules/catalog/repository.ts` pour faciliter la migration future vers PostgreSQL. Les fonctions transactionnelles ne sont pas implémentées. Le code reste indépendant de l’hébergeur.
