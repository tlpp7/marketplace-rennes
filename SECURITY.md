# Security policy — Renn’Fripes

## Supported code

Security fixes are reviewed on a dedicated branch and promoted through pull requests. The application is **not yet approved for commercial launch**.

## Private vulnerability reports

Do not publish an exploit, user information, passwords, API keys, or database URLs in a public GitHub issue. Use GitHub's private vulnerability reporting feature if enabled on the repository; otherwise contact the repository owner privately through an existing trusted channel.

Include reproduction steps, affected routes, expected/actual behavior and a suggested remediation without including customer data.

## Operational rules

- Secrets live in Railway environment variables. Keep them out of Git commits, screenshots and logs.
- Never run test fixtures or destructive migrations against production PostgreSQL.
- All changes affecting login, permissions, orders, stock or payment processing require CI + smoke tests and a review.
- Customer-facing orders stay disabled until a signed payment webhook and stock-reservation transaction are verified.
- Any leaked key must be revoked and rotated immediately; deleting a commit is not sufficient.

No response time or security certification is guaranteed by this document.
