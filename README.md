# Riad Threads

A product showcase, enquiry funnel and admin dashboard for a UK wholesaler of Moroccan clothing and prayer essentials. Retailers browse the range, build an enquiry list and send it; the owner sees every lead with the products, quantities and (when the visitor allowed it) the pages they looked at, then works it from **New** to **Confirmed** in the dashboard.

There is no online checkout. Deals are agreed with the customer directly.

## Status

| Part | State |
| --- | --- |
| `packages/shared`: Zod schemas, types, constants | Done |
| `apps/api`: REST API and background worker | Done and tested |
| `apps/web`: public website and `/admin` dashboard | Next |

## How it is put together

```
apps/
  api/        Express 5 + TypeScript API, and the BullMQ worker (same code, second entry point)
  web/        Next.js site and dashboard (not started yet)
packages/
  shared/     Validation schemas and types used by both apps
  config/     Shared TypeScript settings
docker/       Dockerfile for the API and worker
```

- **Database:** MongoDB Atlas (any MongoDB 6+ replica set works, since enquiries are written in a transaction).
- **Object storage:** MinIO (any S3-compatible service). Originals stay in a private bucket; processed images are served from a public one.
- **Redis:** two separate instances. The *cache* may evict keys. The *queue* is persistent and never evicts; it also holds rate-limit counters.
- **Background work:** media processing and e-mail run in the worker. E-mails are also recorded in MongoDB, and a sweeper re-queues anything left pending, so a Redis restart cannot lose a notification.

## Requirements

- Node.js 22 or newer
- pnpm 12 (`npm install -g pnpm`)
- Docker (for local Redis and MinIO)
- A MongoDB connection string (Atlas)

## Getting started

```bash
# 1. Configure
cp .env.example .env        # then fill in MONGODB_URI, the JWT secrets and ADMIN_* values

# 2. Start Redis (cache + queue) and MinIO
pnpm infra:up

# 3. Install
pnpm install

# 4. Create the first admin account (safe to repeat; it never overwrites an existing admin)
pnpm seed:admin

# 5. Optional: load a demo catalogue if you have the placeholder images locally
pnpm seed:demo

# 6. Run the API and the worker (two terminals)
pnpm dev:api
pnpm dev:worker
```

The API listens on `http://localhost:4000`. `GET /api/health` reports the database and both Redis instances.

The API also creates the admin on start-up when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set and no admin exists.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev:api` / `pnpm dev:worker` | Run the API / worker with reload |
| `pnpm build` | Bundle the API and worker |
| `pnpm typecheck` | Strict TypeScript check across the workspace |
| `pnpm test` | Unit tests |
| `pnpm --filter @riad/api test:int` | Integration tests against the configured test database and MinIO |
| `pnpm seed:admin` / `pnpm seed:demo` | Seed the admin account / a demo catalogue |
| `pnpm infra:up` / `pnpm infra:down` | Start or stop local Redis and MinIO |

Integration tests create their own data under a unique prefix and remove it afterwards. Point `MONGODB_URI` at a **test** database, never production.

## API at a glance

Everything is under `/api/v1`. Responses use one envelope: `{ success, message, data, meta? }`, and errors add `errorSources`.

**Public**

- `GET /site`: homepage content and settings
- `GET /categories`, `GET /collections`
- `GET /products` (filters: `category`, `collection`, `colour`, `fabric`, `q`, `sort`, `page`), `GET /products/filters`, `GET /products/:slug`
- `POST /enquiries`: idempotent by `submissionKey`
- `POST /line-sheet`
- `POST /tracking/events`: only accepted for visitors who gave consent

**Admin** (cookie session, plus an `x-riad-csrf: 1` header on writes)

- `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`
- `/admin/products`, `/admin/categories`, `/admin/collections`, `/admin/media`
- `/admin/enquiries` (list, detail, status, notes, follow-up, CSV export, e-mail retry)
- `/admin/analytics/overview`, `/admin/content/*`, `/admin/settings`, `/admin/account`

## Design decisions worth knowing

- **No N+1 queries.** List endpoints use a fixed number of queries however many rows they return, and integration tests assert it by counting database operations.
- **Enquiries are never lost.** The enquiry, its reference and its e-mail records are saved in one transaction before success is shown, and retries are safe.
- **Consent first.** Journeys, visitor ids and sources are stored only when the visitor accepted tracking. An enquiry works either way.
- **Published means ready.** A product can only go live once it has a cover image, alt text, a colour with a swatch, a size and wholesale details, and all its files are processed.
- **Simple authentication for now.** One seeded admin with an argon2 password and rotating refresh tokens. The user model already has a role and a two-factor slot.

## Deployment

The target is a single Ubuntu VPS running Docker Compose behind Caddy, with MongoDB Atlas hosted separately and placed in the same region as the server. `docker/Dockerfile.api` builds the image used by both the API and the worker (`node dist/server.js` or `node dist/worker.js`). Configuration comes entirely from environment variables; see `.env.example`. There is no CI/CD pipeline.

For a staging site without a domain, set `SITE_URL` to the server address and `NOINDEX=true` so search engines ignore it.

## Notes on MinIO

The official `minio/minio` image is no longer published. The local compose file defaults to a compatible community image and reads it from `MINIO_IMAGE`, so any S3-compatible service can be used instead.

## Security

Secrets live only in `.env`, which is git-ignored. Never commit real credentials. If a secret was shared anywhere, rotate it.
