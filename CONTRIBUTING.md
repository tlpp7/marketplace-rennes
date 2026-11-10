# Contributing to Renn’Fripes

## Workflow

1. Branch from the latest tested work; avoid direct edits to branches tracked by production Railway.
2. Open a draft PR for changes affecting database, authentication, permissions, storage or payments.
3. Keep commits focused and review each migration separately.
4. Do not add real customer data, secret keys, production DB dumps or user photos to the repository.
5. Do not enable `ORDERS_ENABLED`, `ACCOUNTS_ENABLED` or `SEO_PUBLIC` without the release checklist.

## Local verification

```bash
npm ci
npm run test:config
npm run test:unit
npm run test:release
npm run lint
npm run build
```

Run PostgreSQL integration tests against a **dedicated disposable test database** following `docs/V02_OPERATIONS.md`. Run `npm run test:smoke:security` only while the local Next.js server and its PostgreSQL test database are running.

## Review requirements

- CI green on the PR head commit.
- No secret-bearing files tracked; external media and private mandate documents belong in durable storage, not Git.
- The PR explains API behavior and compatibility, required migrations, rollback and the effect on Railway.
- Database migrations are verified on staging first. Backups and a tested restore are mandatory before production migrations.

## Deployments

Railway services may automatically deploy pushes to their connected branches. **Merging is a release operation**, not an administrative cleanup. Keep this branch isolated until the release decision.
