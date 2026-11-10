# Renn’Fripes — critères de passage en production

**Statut : NOT READY FOR COMMERCIAL LAUNCH.** Une application Next.js déployée et un build vert ne prouvent ni la possibilité d'encaisser un paiement ni le respect des exigences juridiques.

## 1. Vérifications avant toute promotion

- [ ] PR revue ; GitHub Actions du **dernier commit** vertes (CI et Quality Gates).
- [ ] `npm ci && npm run test:config && npm run test:unit && npm run test:release && npm run lint && npm run build` réussissent.
- [ ] Aucune variable secrète, photo privée ou donnée client dans GitHub ou les logs.
- [ ] Environnements test et production séparés ; pas de réutilisation de `DATABASE_URL` ni des buckets privés.
- [ ] `APP_ORIGIN` et `NEXT_PUBLIC_SITE_URL` égaux, réels et HTTPS ; `SESSION_SECRET` d'au moins 32 caractères.
- [ ] Sauvegarde PostgreSQL préalable et **restauration sur un environnement isolé vérifiée** ; pas de migration directe sans plan de retour arrière.
- [ ] Migrations `001` à `007` auditées sur base de test ; migrations futures avec historique/version et stratégie de rollback.
- [ ] `/api/health/live/` retourne 200 et `/api/health/` retourne 200 quand PostgreSQL fonctionne ; alertes 5xx et erreurs DB à configurer.
- [ ] Domaine et HTTPS actifs ; cookies HTTP-only/secure ; headers `nosniff`, `DENY`, `no-referrer`.
- [ ] Photos et documents : stockage persistant, vérification des médias, autorisations de lecture et règles de conservation ; **actuellement incomplet**.
- [ ] Mandat et CGV vérifiés juridiquement ; identité de l'exploitant, SIRET et mentions légales exactes.
- [ ] SMTP authentifié et testé ; vérifications d'email, mots de passe et anti-abus.
- [ ] Les articles réels sont disponibles et contrôlés ; articles démo non vendables.

## 2. Blocages commerciaux P0

- [ ] Stripe Checkout (ou autre PSP autorisé) implémenté, en mode test puis live.
- [ ] Webhooks Stripe signés, idempotents, transactions et états de paiement persistés.
- [ ] Réservation de stock atomique, sans double vente ; annulation et remboursement testés.
- [ ] Livraison et retours, frais, information préalable et service client documentés.
- [ ] Sauvegardes automatisées, surveillance, test de restauration et plan d'incident.
- [ ] Données et traitements vérifiés vis-à-vis des exigences de confidentialité/RGPD.

**Interdiction de démarrer les commandes en production :** maintenir `ORDERS_ENABLED=false`. La configuration serveur et l'API de commande l'imposent à ce stade.

## 3. Exécution dans Codespaces

```bash
cd /workspaces/marketplace-rennes
git switch chore/production-readiness
git pull --ff-only origin chore/production-readiness
npm ci
npm run test:config
npm run test:unit
npm run test:release
npm run lint
npm run build
```

Les tests PostgreSQL doivent viser une **base de test**. Ne pas exécuter de script de migration sur `angelic-transformation` sans sauvegarde validée. Pour le smoke HTTP local : démarrer Next.js avec une base de test, puis `npm run test:smoke:security`.

## 4. Publication contrôlée

- Ne **pas** faire de push direct sur une branche reliée à la production Railway pour valider une expérimentation.
- Tester le même commit sur la préproduction et conserver les logs de validation.
- Avant toute modification de PostgreSQL en production, prévoir sauvegarde, validation de restauration, fenêtre d'intervention et rollback.
- Surveiller les 4xx/5xx, latences, erreurs de migrations, pics CPU/mémoire et coûts.
- En cas de régression applicative, revenir au dernier commit validé. Les migrations SQL ne sont pas automatiquement annulées par un rollback Git : elles nécessitent un plan séparé.

## 5. État des vérifications

La checklist est un **contrat de passage en production**, pas un document certifiant que tous les éléments sont achevés. La mise en ligne commerciale reste bloquée tant que les exigences P0 ne sont pas satisfaites.
