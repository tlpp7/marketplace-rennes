# PostgreSQL dans GitHub Codespaces — Renn'Fripes

## Important
- Ouvrir le **port 3000** pour le site.
- Le port **5432** est PostgreSQL : il ne se visite pas dans un navigateur. Un HTTP 502 sur ce port ne signifie pas que la base est en panne.
- Les deux ports restent privés pendant les tests.

## Démarrage
Dans le terminal Codespaces :
```bash
cd /workspaces/marketplace-rennes
git pull --ff-only origin main
docker version
docker compose version
bash scripts/setup-local.sh
npm install
npm run db:check
npm run check
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Si Docker ne fonctionne pas, récupérer l'erreur précise : `docker info`. Ne pas effacer les volumes ni les fichiers .env pour résoudre une erreur de connexion.

## Diagnostics
```bash
docker compose --env-file infra/docker/.env -f infra/docker/compose.dev.yml ps
docker compose --env-file infra/docker/.env -f infra/docker/compose.dev.yml logs --tail=60 postgres
docker compose --env-file infra/docker/.env -f infra/docker/compose.dev.yml exec postgres pg_isready -U rennfripes -d rennfripes
npm run db:check
curl -i http://127.0.0.1:3000/api/health
```

## Comptes
Par défaut, inscriptions fermées sur une nouvelle installation. Pour tests strictement privés, mettre `ACCOUNTS_ENABLED=true` et `ALLOW_UNVERIFIED_LOCAL=true` dans .env.local, puis relancer le serveur. Cela ne remplace pas l'email de vérification dans un service public.

Les secrets restent dans `.env.local` et `infra/docker/.env` non versionnés.

## Publication
Avant tout service public : SMTP/confirmation email, récupération de compte, HTTPS, modération, sécurité, conformité RGPD, tests de concurrence et sauvegardes hors du Codespace.
