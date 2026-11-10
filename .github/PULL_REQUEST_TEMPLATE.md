## Objet du changement

Décrire le besoin, les routes/composants concernés et les risques.

## Tests

- [ ] `npm ci`
- [ ] `npm run test:config && npm run test:unit && npm run test:release`
- [ ] `npm run lint && npm run build`
- [ ] Tests PostgreSQL / navigateur pertinents (base de test uniquement)
- [ ] GitHub Actions verts sur le dernier commit

## Impact d'exploitation

- [ ] Aucune nouvelle variable sensible dans le dépôt
- [ ] Les nouveaux paramètres sont documentés dans `.env.example`
- [ ] Les migrations sont idempotentes ou accompagnées d'un plan de migration
- [ ] Sauvegarde et retour arrière documentés si données ou schéma modifiés
- [ ] Impact des déploiements automatiques Railway examiné
- [ ] Pas d'activation des commandes/paiements sans validation de `docs/PRODUCTION-READINESS.md`

## Publication

PR brouillon tant que des vérifications restent ouvertes. Préproduction avant promotion vers une branche reliée à Railway production.
