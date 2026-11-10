# Renn’Fripes — Marketplace de seconde main à Rennes

Application Next.js 16 / React 19 / PostgreSQL pour le dépôt-vente de vêtements et la communauté locale.

**État : préproduction technique, pas encore de lancement commercial.** Catalogue de démonstration disponible ; les articles réellement publiés proviennent de PostgreSQL. Les **commandes et paiements restent désactivés** jusqu'à intégration et validation du prestataire de paiement, des remboursements et des protections anti-double vente.

**Avant toute ouverture :** [Critères de release](docs/PRODUCTION-READINESS.md) · [Architecture](docs/ARCHITECTURE.md) · [Configuration Railway](docs/RAILWAY-CONFIG.md).

## Fonctionnalités

- Comptes, sessions, profils, messagerie, rendez-vous et administration protégés ;
- Dépôt-vente : demande, examen, acceptation, attribution d'un SKU ;
- Mandat de dépôt-vente : texte de conditions configuré par l'exploitant, acceptation explicite, archivage du document et empreinte SHA-256 ;
- Attestation de réception physique avec référence de bordereau, emplacement, opérateur et horodatage ;
- Contrôle qualité documenté avec validation/refus et checklist ;
- Catalogue public synchronisé sur les **seuls articles publiés et vérifiés** ;
- Historique des mouvements et transitions de stock protégées en API **et PostgreSQL**.

## Séquence V0.2

~~~text
Demande du déposant
    ↓
Examen et acceptation administrateur → SKU
    ↓
Mandat accepté par le déposant
    ↓
Attestation de réception physique
    ↓
Contrôle qualité
    ├─ Refus → retour
    └─ Accord → prêt
                   ↓
          Publication avec photo
                   ↓
       Catalogue public (sans paiement)
~~~

**Guide complet d'exploitation et de migration : [docs/V02_OPERATIONS.md](docs/V02_OPERATIONS.md).**

## Installation dans Codespaces

~~~bash
cd /workspaces/marketplace-rennes
npm ci
npm run lint
npm run build
npm run test:unit
npm run test:config
npm run test:release
npm run dev
~~~

Variables nécessaires aux fonctions privées : DATABASE_URL, SESSION_SECRET et les paramètres de comptes/email adaptés à l'environnement. Ne pas committer les fichiers .env*.

Pour les **mandats**, renseigner la raison sociale, adresse, SIRET, version et texte des conditions dans les variables CONSIGNMENT_OPERATOR_NAME, CONSIGNMENT_OPERATOR_ADDRESS, CONSIGNMENT_OPERATOR_SIRET, CONSIGNMENT_TERMS_VERSION, CONSIGNMENT_TERMS_TEXT. Sans elles, l'acceptation de mandat reste volontairement impossible.

Pour les photos externes autorisées, configurer CONSIGNMENT_MEDIA_HOSTS. Les images sous public/consignments/ peuvent être référencées par un chemin relatif **uniquement si elles sont livrées dans le code**. Les photos téléchargées à l'exécution doivent à terme passer par le stockage S3 persistant ; les buckets sont provisionnés, mais l'adaptateur d'upload reste à développer.

## Migration et tests de V0.2

**Vérifier que DATABASE_URL pointe sur une base de test isolée avant d'exécuter ces commandes.** Les migrations 001 à 005 doivent être installées en premier.

~~~bash
node --env-file=.env.local scripts/migrate-v02.mjs
node --env-file=.env.local scripts/check-database.mjs
RF_V02_TEST_MODE=true node --env-file=.env.local --test scripts/test-v02-db.mjs
~~~

GitHub Actions vérifie les migrations, les transitions de stock, le build et le parcours API complet avec des comptes et un mandat fictifs. L'environnement CI n'encaisse aucun paiement réel.

## Déploiement

Railway héberge l'application Next.js et PostgreSQL. La publication d'une nouvelle version exige : sauvegarde de la base, migrations appliquées sur la bonne base, variables de production vérifiées, tests de non-régression verts et conditions juridiques validées.

La branche `security/dependency-hardening` est reliée à Railway. **Ne pas pousser des expérimentations directement dessus.** La préparation de release est isolée dans `chore/production-readiness` et doit passer par une pull request avant toute promotion. Vérifier les branches reliées aux services dans Railway avant chaque fusion.

## Sécurité et limites

- Aucune donnée de carte bancaire n'est collectée par les routes V0.2.
- Un document horodaté avec hash n'est **pas** une signature électronique qualifiée.
- La validité juridique du mandat doit être vérifiée par un professionnel avant ouverture commerciale.
- Les attestations sont des déclarations d'opérateur : vérifier les remises et bordereaux réels.
- Les photos publiques ne doivent contenir ni document privé ni métadonnées personnelles.
- Les achats et paiements relèvent de la V0.3 et sont désactivés par défaut.

Feuille de route : [docs/ROADMAP.md](docs/ROADMAP.md).
