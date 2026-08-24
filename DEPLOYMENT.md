# Deploying CANDRON OneERP

A multi-tenant Next.js 16 (App Router) app with Prisma. Local dev runs on SQLite;
production should run on Postgres.

## 1. Environment

Copy `.env.example` → `.env` and set:

- `DATABASE_URL` — connection string (SQLite file for dev, Postgres for prod).
- `AUTH_SECRET` — signs the JWT session cookie. Generate with `openssl rand -base64 48`.

## 2. Local development (SQLite)

```bash
npm install
npx prisma db push        # create/refresh the schema on dev.db
npx tsx prisma/seed.ts     # seed CANDRON tenant + demo data
npm run dev                # http://localhost:3550
```

Demo logins (password `candron123`): `meera@candron.in` (admin),
`vikram@candron.in` (manager), `viewer@candron.in` (read-only).

## 3. Switching to Postgres (production)

1. In `prisma/schema.prisma`, change the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
2. Point `DATABASE_URL` at your Postgres instance (Neon, RDS, Supabase, etc.).
3. Create the schema and seed:
   ```bash
   npx prisma migrate deploy   # or: npx prisma db push
   npx tsx prisma/seed.ts       # optional: only for a demo tenant
   ```

The data model is provider-agnostic (every table carries `tenantId`; JSON columns
are used for rate cards, tenant config, and family schemas), so no model changes
are needed beyond the provider switch.

## 4. Docker

```bash
docker build -t oneerp .
docker run -p 3000:3000 --env-file .env oneerp   # http://localhost:3000
```

The image uses Next's standalone output. For Postgres, run
`npx prisma migrate deploy` against your database once before/at first boot
(e.g. an init container or a release step). For a single-instance SQLite deploy,
mount a volume at `/app/prisma` so `dev.db` persists.

## 5. Vercel / serverless

- Use Postgres (SQLite won't persist on serverless).
- Set `DATABASE_URL` and `AUTH_SECRET` as project env vars.
- Add `prisma generate` to the build (already run by `npm run build` via
  `postinstall`, or add it to the build command).
- Run migrations from CI or a one-off command, not at request time.

## 6. Notes

- `middleware.ts` is the auth wall (Next 16 will eventually rename this convention
  to `proxy.ts`; it still works today).
- All application routes are dynamic (server-rendered) because they read the
  session cookie — expected for an authenticated app.
