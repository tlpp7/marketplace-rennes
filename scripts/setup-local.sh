#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if ! command -v docker >/dev/null; then echo "Docker requis"; exit 1; fi
if [[ ! -f infra/docker/.env ]]; then
  umask 077
  printf 'POSTGRES_PASSWORD=%s\n' "$(openssl rand -hex 24)" > infra/docker/.env
fi
set -a
source infra/docker/.env
set +a
docker compose --env-file infra/docker/.env -f infra/docker/compose.dev.yml up -d --wait
docker compose --env-file infra/docker/.env -f infra/docker/compose.dev.yml exec -T postgres psql -U rennfripes -d rennfripes < infra/sql/001_social.sql
docker compose --env-file infra/docker/.env -f infra/docker/compose.dev.yml exec -T postgres psql -U rennfripes -d rennfripes < infra/sql/002_consignment.sql
docker compose --env-file infra/docker/.env -f infra/docker/compose.dev.yml exec -T postgres psql -U rennfripes -d rennfripes < infra/sql/003_admin.sql
docker compose --env-file infra/docker/.env -f infra/docker/compose.dev.yml exec -T postgres psql -U rennfripes -d rennfripes < infra/sql/004_orders.sql
if [[ ! -f .env.local ]]; then
  umask 077
  printf 'DATABASE_URL=postgresql://rennfripes:%s@127.0.0.1:5432/rennfripes\nSESSION_SECRET=%s\nACCOUNTS_ENABLED=true\nSEO_PUBLIC=false\n' "$POSTGRES_PASSWORD" "$(openssl rand -hex 48)" > .env.local
fi
echo "PostgreSQL prêt. Lance npm install puis npm run dev. Ne publie pas les ports de Codespaces."
