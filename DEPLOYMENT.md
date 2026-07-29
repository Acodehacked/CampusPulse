# CampusPulse — Production Deployment (Ubuntu LTS + Docker)

This covers deploying the single `campuspulse` container behind a reverse proxy on a plain Ubuntu LTS VPS, backed by a managed (hosted) Supabase project. Postgres/Auth/Storage/Realtime all live in Supabase — this stack never runs its own database.

```
Internet → DNS/TLS → Reverse proxy (Caddy or your existing one) → campuspulse container (:3000, private) → Managed Supabase
```

## Prerequisites

- Ubuntu 22.04/24.04 LTS with Docker Engine + the Docker Compose plugin installed.
- A hosted Supabase project (Project Settings → API for the URL/keys, Project Settings → Database for the connection string).
- A domain pointed at the VPS, if using the bundled Caddy service for automatic TLS.

## 1. Initial deployment

```bash
git clone <your-repo-url> /opt/campuspulse
cd /opt/campuspulse

cp .env.example .env
# Fill in real values (see below) — .env is never committed.
```

Required `.env` values:

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API (publishable/anon key) |
| `SUPABASE_SECRET_KEY` | Project Settings → API (secret/service_role key — **never** expose this client-side) |
| `SUPABASE_DB_URL` | Project Settings → Database → Connection string (use the session pooler connection) |
| `ALLOWED_ORIGIN` | Your production URL, e.g. `https://campuspulse.example.edu` (only needed if the app is ever called cross-origin) |

Apply migrations to the hosted project (from your machine or CI, not the VPS):

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Build and start:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

If you already have a reverse proxy on this host, skip the `caddy` service (edit `docker-compose.prod.yml` to remove it) and point your existing proxy at `127.0.0.1:3000` — the app container only binds internally via `expose`, never a public port.

If using the bundled Caddy service, edit `Caddyfile` first with your real domain.

## 2. Environment setup

The compose file passes `NEXT_PUBLIC_*` values as Docker build args (they're inlined into the client bundle at build time — see the Dockerfile's `builder` stage) and everything else via `.env` at runtime. Changing a `NEXT_PUBLIC_*` value always requires a rebuild; changing a server-only secret only requires a restart.

## 3. Migration deployment

Whenever `supabase/migrations/` changes:

```bash
npx supabase db push
```

Migrations are never applied automatically by the app container — this is a deliberate, explicit step.

## 4. Image update (new release)

```bash
cd /opt/campuspulse
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

This rebuilds only the `app` image and recreates that container; Caddy (if used) is untouched.

## 5. Rollback

```bash
git checkout <previous-tag-or-commit>
docker compose -f docker-compose.prod.yml up -d --build
```

If the previous release's migrations are incompatible with the current database, restore via Supabase's own point-in-time recovery / backups rather than trying to reverse a migration by hand.

## 6. Logs

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

## 7. Health checking

The container's built-in healthcheck hits `/api/health`:

```bash
docker inspect --format='{{json .State.Health}}' campuspulse | jq
```

Or directly:

```bash
curl -f http://127.0.0.1:3000/api/health
```

## 8. Restart

```bash
docker compose -f docker-compose.prod.yml restart app
```

`restart: unless-stopped` is already set, so the container also survives a host reboot without manual intervention.

## Notes

- Only ports 80/443 (via the reverse proxy) are ever exposed publicly; the app's port 3000 stays private to the Docker network (`expose`, not `ports`).
- The production image runs as a non-root user (see `Dockerfile`) and contains no dev dependencies (multi-stage build, Next.js `output: "standalone"`).
- `npm audit` currently reports a handful of high-severity advisories in build-time-only tooling (eslint's `minimatch`, Next's bundled `postcss`/`sharp`) — these are transitive dependencies of the build toolchain, not runtime API surface, and `npm audit fix --force` would downgrade Next.js to an unrelated ancient major version. Re-check `npm audit` periodically as upstream releases catch up.
