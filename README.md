# Riad Threads

A product showcase, enquiry funnel and admin dashboard for a UK wholesaler of Moroccan clothing and prayer essentials. Retailers browse the range, build an enquiry list and send it; the owner sees every lead with the products, quantities and (when the visitor allowed it) the pages they looked at, then works it from **New** to **Confirmed** in the dashboard.

There is no online checkout. Deals are agreed with the customer directly.

## Status

| Part | State |
| --- | --- |
| `packages/shared`: Zod schemas, types, constants | Done |
| `apps/api`: REST API and background worker | Done and tested |
| `apps/web`: public website and `/admin` dashboard | Done and tested in a browser |

## How it is put together

```
apps/
  api/        Express 5 + TypeScript API, and the BullMQ worker (same code, second entry point)
  web/        Next.js site (server-rendered) and the /admin dashboard
packages/
  shared/     Validation schemas and types used by both apps
  config/     Shared TypeScript settings
docker/       Dockerfile for the API and worker
```

- **Database:** MongoDB Atlas (any MongoDB 6+ replica set works, since enquiries are written in a transaction).
- **Object storage:** SeaweedFS (any S3-compatible service works: R2, S3). Originals stay in a private bucket; processed images are served from a public one.
- **Redis:** two separate instances. The *cache* may evict keys. The *queue* is persistent and never evicts; it also holds rate-limit counters.
- **Web app:** Next.js App Router with TypeScript and Tailwind. Public pages are rendered on the server from the API and cached with tags, so a publish in the dashboard refreshes exactly the pages it touches. Interactive parts (filters, the enquiry list, the dashboard) use Redux Toolkit and RTK Query. The browser only talks to its own origin: `/api` goes to the API and `/media` to public storage.
- **Background work:** media processing and e-mail run in the worker. E-mails are also recorded in MongoDB, and a sweeper re-queues anything left pending, so a Redis restart cannot lose a notification.

## Requirements

- Node.js 22 or newer
- pnpm 12 (`npm install -g pnpm`)
- Docker (for local Redis and SeaweedFS)
- A MongoDB connection string (Atlas)

## Getting started

```bash
# 1. Configure
cp .env.example .env        # then fill in MONGODB_URI, the JWT secrets and ADMIN_* values

# 2. Start Redis (cache + queue) and SeaweedFS
pnpm infra:up

# 3. Install
pnpm install

# 4. Create the first admin account (safe to repeat; it never overwrites an existing admin)
pnpm seed:admin

# 5. Optional: load a catalogue from local photos (never run against a production database)
pnpm seed:catalogue

# 6. Configure the web app
cp apps/web/.env.example apps/web/.env.local

# 7. Run the API, the worker and the web app (three terminals)
pnpm dev:api
pnpm dev:worker
pnpm dev:web
```

The website is on `http://localhost:3000` and the dashboard on `http://localhost:3000/admin`. The API listens on `http://localhost:4000`. `GET /api/health` reports the database and both Redis instances.

The API also creates the admin on start-up when `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set and no admin exists.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev:api` / `pnpm dev:worker` / `pnpm dev:web` | Run the API / worker / web app with reload |
| `pnpm build` | Build the API, the worker and the web app |
| `pnpm typecheck` | Strict TypeScript check across the workspace |
| `pnpm test` | Unit tests |
| `pnpm --filter @riad/api test:int` | Integration tests against the configured test database and storage |
| `pnpm seed:admin` / `pnpm seed:catalogue` | Seed the admin account / a catalogue and home page content from local photos |
| `pnpm infra:up` / `pnpm infra:down` | Start or stop local Redis and SeaweedFS |

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

## Website and dashboard

**Public site:** `/`, `/collections`, `/collections/[slug]`, `/products/[slug]`, `/enquiry`, `/about`, `/contact`, `/faq`, `/privacy`, `/cookies`, `/terms`, plus `sitemap.xml` and `robots.txt`. Unknown products and collections answer a real 404.

**Dashboard (`/admin`):** overview, enquiries (table, board and detail panel with status, notes, follow-up and CSV export), products (list and full editor with a publish checklist), media library, categories, collections, website content (home blocks, section order, text pages) and settings.

The web app reads its own variables from `apps/web/.env.local` (see `apps/web/.env.example`). `INTERNAL_API_SECRET` must match the API so server-side calls skip the per-IP rate limits, and `REVALIDATE_SECRET` must match so the API can refresh pages after a publish (set `WEB_REVALIDATE_URL` in the API to `<site>/api/revalidate`).

## Design decisions worth knowing

- **No N+1 queries.** List endpoints use a fixed number of queries however many rows they return, and integration tests assert it by counting database operations.
- **Enquiries are never lost.** The enquiry, its reference and its e-mail records are saved in one transaction before success is shown, and retries are safe.
- **Consent first.** Journeys, visitor ids and sources are stored only when the visitor accepted tracking. An enquiry works either way.
- **Published means ready.** A product can only go live once it has a cover image, alt text, a colour with a swatch, a size and wholesale details, and all its files are processed.
- **Simple authentication for now.** One seeded admin with an argon2 password and rotating refresh tokens. The user model already has a role and a two-factor slot.

## Deployment

The target is a single Ubuntu VPS running Docker Compose behind Caddy, with MongoDB Atlas hosted separately and placed in the same region as the server. `docker/Dockerfile.api` builds the image used by both the API and the worker (`node dist/server.js` or `node dist/worker.js`). Configuration comes entirely from environment variables; see `.env.example`. There is no CI/CD pipeline.

Both containers share one healthcheck: the API answers `/api/health`, and the worker keeps a heartbeat file fresh while it is connected to MongoDB and the queue. The web app's server should send `INTERNAL_API_SECRET` as `x-internal-key` on its API calls, so they are not rate-limited as if every visitor were one person. Run with `NODE_ENV=production` on any public server, staging included.

For a staging site without a domain, set `SITE_URL` to the server address and `NOINDEX=true` so search engines ignore it.

## Notes on storage

Media lives in SeaweedFS, reached through the standard S3 API on port 8333. The API only uses plain S3 calls, so Cloudflare R2 or AWS S3 can replace it by changing the `S3_*` variables.

SeaweedFS does not use bucket policies for anonymous access. Public read on the public bucket is granted in its identity file (`docker/seaweedfs/s3.dev.json` locally): anonymous visitors may read single objects there, but cannot list buckets, write, or reach the private bucket. The dev file holds development keys only; production needs its own file with fresh keys.

## Security

Secrets live only in `.env`, which is git-ignored. Never commit real credentials. If a secret was shared anywhere, rotate it.
