# Validation P0 / P1 (serveur local uniquement)

Les scripts de ce dossier n'acceptent que `localhost`, `127.0.0.1` ou `[::1]`. Ils ne créent pas de comptes et ne réalisent pas de commandes réelles.

## Préparation

Démarrer une instance **isolée**, avec sa base de test et ses migrations, sur le port 3100. Ne pas exécuter ces tests sur la production.

```bash
export RF_TEST_BASE=http://127.0.0.1:3100
npm run test:p0
npm run test:p1
npm run test:security
```

Sans session, les contrôles anonymes P0 sont exécutés ; les scénarios nécessitant une session sont marqués **SKIP**, pas PASS.

Pour les scénarios authentifiés, utiliser un **compte de test non administrateur** :

```bash
export RF_TEST_COOKIE='rf_session=<cookie-de-test>'
npm run test:p0
npm run test:p1
```

Ne jamais committer, afficher dans les logs ni partager ces cookies.

Pour tester l'isolation de la messagerie, définir aussi `RF_TEST_CONVERSATION_ID` et `RF_TEST_COOKIE_A`, `RF_TEST_COOKIE_B`, `RF_TEST_COOKIE_C` : A et B sont membres d'une conversation de test, C est extérieur. La suite `tests/integration/messages-access.test.mjs` utilise les mêmes variables.

Pour vérifier les références invalides des commandes lorsque `ORDERS_ENABLED=true` sur le serveur de test, définir `RF_TEST_ORDERS_ENABLED=true`.

## Couverture et limites

- **P0** : accès anonymes refusés, routes admin protégées, requête cross-origin rejetée, session valide et séparation des conversations (si fixtures disponibles).
- **P1** : lecture des dépôts et commandes du compte de test, rejet de dépôts invalides, référence de commande invalide (si activée), accès inventaire refusé aux non-admins.
- **Non couvert par ces scripts** : cycle complet de création/annulation de commandes, workflow de dépôt et inventaire administrateur, déconnexion et sessions expirées. Ces parcours nécessitent des fixtures dédiées et une base réinitialisable.

Un résultat avec des tests ignorés n'est **pas** une validation complète P0/P1. Contrôler le nombre de SKIP et les réponses API. Aucun déploiement automatique n'est configuré.
