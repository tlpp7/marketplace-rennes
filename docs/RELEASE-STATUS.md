# Renn'Fripes — suivi des versions
- V0.1 : interface/cataloque statique fonctionnel sur données fictives. Publication commerciale non ouverte.
- V0.2 : profils fictifs et annuaire des vrais profils approuvés, base prête. Pas de flux commercial réel.
- V0.3 : inscription/session, messagerie, suivis, demandes de RDV et avis en attente. Nécessite PostgreSQL, vérification des emails, limitations de débit, modération et tests E2E.
- V0.4 / finition V0.2 dépôt-vente : demandes, permissions, SKU, réception attestée, contrôle qualité documenté, mandat électronique horodaté et catalogue dynamique sont codés sur security/dependency-hardening. Migrations 006/007 et essais sur base isolée requis ; le mandat doit être revu juridiquement.
- V0.5 : commandes demandées en mode privé, calcul de prix, bases expéditions/événements PSP. Pas de paiement ni de livraison réelle.

**Règle de lancement** : jamais activer comptes et commandes pour le public sans audit sécurité et parcours conforme.

## Durcissement en préparation (PR dédiée)

Les tâches de préparation à la production portent sur des protections HTTP (`Origin`, limites JSON, en-têtes), des contrôles de santé distincts, la reproductibilité `npm ci`, l'audit automatique du dépôt et la documentation de release.

**Ces tâches ne débloquent pas les paiements**, n'installent pas le connecteur S3 et ne remplacent pas la revue des sauvegardes. Voir `docs/PRODUCTION-READINESS.md` pour les critères de promotion.

## V0.5.1 — Dimension 1 : règles invariantes (branche isolée)
- Calcul de commission exact en centimes avec BigInt et conservation des montants.
- Modèle optionnel de viabilité par transaction et seuil de rentabilité (hypothèses, pas prévision).
- Politique unique des transitions administrateur, actions métier et preuves de publication.
- Origine HTTP et SHA-256 extraits en modules testables.
- Nouvelle migration `008_v051_unsettled_sale_guard.sql` interdisant de marquer un stock vendu sans flux PSP vérifié.
- Tests de propriétés déterministes et vérifications PostgreSQL dans GitHub Actions.

**Non fusionné / non déployé en production.** Voir `docs/V0.5.1-INVARIANTS.md`.
