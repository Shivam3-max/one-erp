# Deploying CANDRON OneERP on Hostinger (MySQL)

A multi-tenant **Next.js 16 (App Router)** app with **Prisma + MySQL**. It runs a
long-lived Node.js server, so it needs a host that can run Node — **not** classic
PHP shared hosting.

## 0. Pick the right Hostinger plan

Next.js serves from a Node process (Server Components + Server Actions). It will
**not** run on Hostinger's shared/Business web hosting (PHP/Apache).

Use one of:
- **Hostinger VPS** (recommended) — full control: Node 22 + PM2 + Nginx. Steps below.
- Hostinger's **Node.js application hosting**, if your plan offers it (set the env
  vars and start command in hPanel, skip the Nginx/PM2 steps).

MySQL is available on both via hPanel.

## 1. Environment (a DB config and AUTH_SECRET are REQUIRED — the app refuses to start without them)

Copy `.env.example` → `.env`. For the database you have two options; pick one.

**Option A — full connection string:**

```bash
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DBNAME"
```

**Option B — Hostinger shape (recommended on Hostinger):** set the discrete parts
and the app composes the URL. hPanel gives you the database **name** and **user**
as separate fields, usually prefixed (e.g. `u1234567_oneerp`):

```bash
DB_HOST="localhost"          # or the MySQL host hPanel shows
DB_PORT="3306"
DB_NAME="u1234567_oneerp"    # the DB name from hPanel
DB_USER="u1234567_oneerp"    # the DB user from hPanel
DB_PASSWORD="your-db-password"
# DB_PARAMS="connection_limit=5"   # optional extra query params
```

`DATABASE_URL` takes precedence if both are set. The composition is shared by the
app and the Prisma CLI (`npm run db:migrate` / `db:seed`), so the discrete vars
work for migrations too.

Also set:

```bash
AUTH_SECRET="<48-byte random>"   # openssl rand -base64 48
```

`AUTH_SECRET` signs the JWT session cookie. **Never commit it; never reuse the
example value.** There is no insecure fallback — a missing secret is a hard
startup error.

## 2. Create the MySQL database (hPanel)

1. hPanel → **Databases → MySQL** → create a database (`oneerp`) and a user.
2. Grant the user all privileges on that database.
3. Note the host (often `localhost` on a VPS, or the hostname hPanel shows) and build
   the `DATABASE_URL`.

## 3a. Deploy on Hostinger Node.js hosting (hPanel + Passenger)

Hostinger's Node.js app tier runs your app behind **Passenger**, which executes a
single JS **startup file**. This project builds to Next's standalone server and a
`postbuild` step copies the static assets next to it, so the startup file is
`.next/standalone/server.js`.

1. **MySQL** — hPanel → Databases → MySQL → create a database and user (note the
   prefixed names, e.g. `u1234567_oneerp`).
2. **Get the code** — hPanel → Git (or upload): clone
   `https://github.com/Shivam3-max/one-erp.git` into your app folder.
3. **Create the Node app** — hPanel → **Node.js** (Setup Node.js App):
   - **Node version:** 22 (or the highest ≥ 20 available).
   - **Application root:** the folder with the code.
   - **Application URL:** your domain/subdomain.
   - **Application startup file:** `server.mjs` — this **applies pending
     migrations (`prisma migrate deploy`) on every boot**, then starts the Next
     standalone server. (Use `.next/standalone/server.js` directly if you prefer
     to run migrations yourself.)
   - **Environment variables:** `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`,
     `DB_PASSWORD`, `AUTH_SECRET`, and `NODE_ENV=production`.
4. **Install, build, seed** — open the app's terminal (hPanel gives one) and run:
   ```bash
   npm ci
   npm run build           # builds + assembles .next/standalone (postbuild)
   npm run db:seed         # first time only — loads demo data + the UAT users
   ```
   You do **not** need to run `db:migrate` by hand — `server.mjs` applies pending
   migrations automatically each time the app boots.
5. **Restart** the Node app in hPanel. On boot `server.mjs` runs `prisma migrate
   deploy`, then serves on the port Passenger assigns (the server reads `PORT`).
6. **Verify:** open `/api/health` → `{"status":"ok","db":"up"}`, then walk `SOP.md`.

> If hPanel can't run `npm run build` (limited terminal), build locally with the
> same Node version and upload the `.next/` folder alongside the code.
> Locally you can smoke-test the exact Passenger entry with:
> `npm run build && PORT=3570 node .next/standalone/server.js` (env from your shell).

## 3b. Deploy on a Hostinger VPS

```bash
# one-time: Node 22 + PM2
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm i -g pm2

# app
git clone <your-repo> /var/www/oneerp && cd /var/www/oneerp
cp .env.example .env            # then edit with real DATABASE_URL + AUTH_SECRET
npm ci                          # runs `prisma generate` via postinstall
npm run db:migrate              # prisma migrate deploy — creates the schema
# optional, first tenant only — DESTRUCTIVE, wipes all rows, never re-run on prod:
# npm run db:seed
npm run build                   # next build (does NOT touch the database)
pm2 start "npm run start" --name oneerp   # serves on :3550
pm2 save && pm2 startup
```

Then put Nginx in front of `:3550` and add SSL:

```nginx
server {
  server_name your-domain.com;
  location / { proxy_pass http://127.0.0.1:3550; proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme; }
}
```
```bash
sudo certbot --nginx -d your-domain.com   # Let's Encrypt SSL
```

## 4. Schema changes & migrations

- **Develop:** `npm run db:migrate:dev` (creates a new migration from schema changes).
- **Deploy:** `npm run db:migrate` (`prisma migrate deploy` — applies pending
  migrations, non-destructive).
- The initial schema lives in `prisma/migrations/0_init/`.
- **`build` never touches the database** — migrations are an explicit release step so a
  redeploy can't wipe data.

## 5. Docker (alternative)

```bash
docker build -t oneerp .
docker run -p 3000:3000 --env-file .env oneerp
```

Run `npm run db:migrate` against your MySQL once (init container or release step)
before/at first boot. The image uses Next's standalone output.

## 6. Security / ops notes

- `middleware.ts` is the auth wall (Next 16 is migrating this convention to
  `proxy.ts`; `middleware.ts` still works).
- All application routes are dynamic (they read the session cookie) — expected for an
  authenticated app; nothing is statically cached per user.
- Every mutating server action now enforces `requireUser()` + a role check + tenant
  scoping. Keep that invariant when adding actions.
- Still open before heavy production use (see `AUDIT.md`): rate limiting, structured
  logging / error tracking, a health check, automated tests, and upgrading the Prisma
  CLI to clear its remaining advisories.
