# Renn'Fripes — configuration portable Railway (étape 1)

L'application tourne dans **deux projets Railway distincts** :
- Production : `angelic-transformation` (projet `047e5ed0-7f67-42b0-975d-f37898485f36`).
- Préproduction : `sparkling-upliftment` (projet `b9e34156-7f21-4308-881f-5f8fe1048170`).

> Le projet de préproduction a un environnement Railway appelé « production », mais ses données sont séparées. `RF_DEPLOY_ROLE=staging` distingue sa fonction. À terme, un nom d'environnement plus explicite serait préférable.

## Principe

`lib/config/env.ts` valide et normalise les variables serveur : URLs, booléens, ports, accès base, session, SMTP, stockage, mandats et feature flags. Il ne renvoie jamais les secrets au navigateur. Pas de dépendance npm supplémentaire.

- `getServerConfig()` : lecture et validation des formats, avec options facultatives (utile en build Next.js).
- `validateDeploymentConfig()` : validation stricte **à l'exécution** ; requiert `DATABASE_URL`, `SESSION_SECRET` (32 caractères), URLs HTTPS app/site identiques en production, et vérifie les drapeaux de sécurité.
- `npm run test:config` : tests déterministes indépendants de Railway.
- `npm run check:config` : vérifie la configuration courante, affiche seulement les statuts non sensibles.

Ne pas exécuter `check:config` dans une compilation CI sans variables de runtime : les builds n'ont pas nécessairement accès aux secrets. L'utiliser lors d'un contrôle de déploiement, dans un environnement muni de ses secrets.

## Features

| Variable | Valeur avant lancement | Comportement |
| --- | --- | --- |
| `ACCOUNTS_ENABLED` | `false` | Autorise les inscriptions si `true`, nécessite SMTP complet en production |
| `ORDERS_ENABLED` | `false` | Doit rester `false` en production jusqu'à paiement réel vérifié |
| `SEO_PUBLIC` | `false` | Ne publier l'indexation qu'après ouverture commerciale |
| `ALLOW_UNVERIFIED_LOCAL` | `false` | Ne jamais mettre `true` en production |
| `RF_DEPLOY_ROLE` | `staging` ou `production` | Identifie l'environnement opérationnel |

Les options de sécurité sont strictes : seules les chaînes `true` et `false` sont acceptées. Toute autre valeur est refusée.

## Railway variables

Ne jamais copier les secrets dans le code, les logs ou les fichiers du dépôt. Utiliser les **références interservices Railway**.

Production :
```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
S3_ENDPOINT=${{rennfripes-media.ENDPOINT}}
S3_BUCKET=${{rennfripes-media.BUCKET}}
S3_REGION=${{rennfripes-media.REGION}}
S3_ACCESS_KEY_ID=${{rennfripes-media.ACCESS_KEY_ID}}
S3_SECRET_ACCESS_KEY=${{rennfripes-media.SECRET_ACCESS_KEY}}
DOCUMENTS_S3_ENDPOINT=${{rennfripes-documents.ENDPOINT}}
DOCUMENTS_S3_BUCKET=${{rennfripes-documents.BUCKET}}
DOCUMENTS_S3_REGION=${{rennfripes-documents.REGION}}
DOCUMENTS_S3_ACCESS_KEY_ID=${{rennfripes-documents.ACCESS_KEY_ID}}
DOCUMENTS_S3_SECRET_ACCESS_KEY=${{rennfripes-documents.SECRET_ACCESS_KEY}}
```

Préproduction : utiliser `Postgres` et `rennfripes-staging-media` comme noms des ressources. Ne jamais pointer la préproduction sur la base de production.

Les buckets S3 sont **provisionnés**, mais les API de téléchargement et l'accès aux pièces privées doivent encore être intégrés au code. Ajouter les variables de stockage ne les rend pas opérationnels à lui seul.

## Codespaces

```bash
cd /workspaces/marketplace-rennes
git switch security/dependency-hardening
git pull --ff-only origin security/dependency-hardening
npm ci
npm run test:config
npm run test:unit
npm run lint
npm run build
```

Pour `check:config`, fournir une `DATABASE_URL` et un `SESSION_SECRET` destinés au développement, **sans** utiliser les secrets de production.

## Limites de l'étape 1

Cette étape centralise la configuration dans les principaux modules serveur. Elle ne déplace pas PostgreSQL de San Francisco en Europe, ne crée pas de sauvegardes, ne valide pas juridiquement les mandats et n'intègre pas Stripe. Les migrations de production restent soumises à sauvegarde et revue.
