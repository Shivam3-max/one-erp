# CANDRON OneERP — Production Audit & QA

**Date:** 2026-11-16 · **Auditor:** full-stack review (static code + running-app QA)
**Build tested:** `next build` + `next start` on seeded SQLite, driven through the in-app browser and direct server-action calls.

> **Original verdict (2026-11-16): 🔴 NOT READY for a paying client.**
> The app builds, runs, and the happy paths work — but it has **session-forgery via a hardcoded secret**, **broken authorization** (a read-only user can write), **no tenant isolation on writes**, a **critical Next.js CVE**, and a **data model that cannot survive a real deployment** (SQLite + a build step that wipes the DB). None of these are acceptable for production. They are all fixable; see the roadmap.

---

## ✅ Final status (updated 2026-11-17)

> **Current verdict: 🟢 READY for a controlled launch** — pending one live-host smoke pass on Hostinger.

All P0 blockers and the high/medium items from the roadmap have been fixed, verified, and pushed to `main`. The data layer was migrated to **MySQL** and the full stack was run **end-to-end against a real MySQL database** (local MySQL 9.6) in production mode.

**Resolved — by phase:**

| Phase | What was fixed | Original findings |
|---|---|---|
| 0 — Blockers | Require `AUTH_SECRET` (no fallback); upgrade Next.js 16.4 (CVE); non-destructive build + separate `migrate` step; guard + tenant-scope every write action | C-1, C-2, C-3, H-1, H-2, H-3 |
| MySQL | Prisma → MySQL; `@db.Text` + tenant/FK indexes; baseline migration; drop SQLite hack. Deploy config takes discrete `DB_NAME`/`DB_USER`/… (Hostinger shape) | M-1, §7 |
| 1 — Resilience | No mock-data fallback in production; role-gated Settings/Family Studio UI; error/not-found boundaries; `GET /api/health` | H-4, H-5, M-7, M-8 |
| 2 — Tests/Ops | Vitest + CI; in-memory rate limiting on login/register; audit log (`Activity`) on key mutations; honest dashboard KPIs | M-2, L-1 |
| 3 — Correctness/UX | Deterministic RFQ pricing (no `Math.random`); modal a11y (focus-trap/ESC/ARIA) + icon labels; SEO (`robots`/`sitemap`/metadata) | M-6, L-3, L-4 |
| 4 — Hardening | Security headers + CSP (clickjacking/CSP); zod input validation on server actions; structured logger (Sentry-ready hook) | CSP/headers, validation |
| 5 — E2E | Playwright E2E (13 specs) + CI e2e job, against the mock-data dev server | E2E coverage |

**Live-MySQL verification (2026-11-17, production mode, real DB):**
- `prisma migrate deploy` applied cleanly (29 tables, utf8mb4); seed loaded demo data.
- **Every route returned 200**, including the DB-only routes (settings, procurement, manufacturing, testing, quotations, compliance, configurator, estimation, customer detail, family studio).
- Full workflow written and verified in SQL: login → create project → advance stage → quotation → work orders → test plan → record results → communication.
- **Business logic** holds: test certificate issues only when all tests pass and is revoked on any failure.
- **RBAC** holds on the real DB: viewer and unauthenticated writes blocked; no state changed.
- **No application bugs found.**

**Quality gate (all green):** 35 unit tests · 13 Playwright E2E · `tsc` · `next build`.

**Remaining before/after go-live (non-blocking fast-follows):**
- One **live Hostinger smoke pass** (provision MySQL there, set `DB_*` + `AUTH_SECRET`, `npm run db:migrate`, repeat the workflow) — the last gate.
- **Prisma CLI** upgrade to clear its 3 remaining `npm audit` highs (breaking major — do it with a DB to verify).
- Wire the logger's `captureException` hook to a real tracker (e.g. **Sentry**).
- **ESLint in CI** (currently deferred — `eslint-config-next@16` + `eslint@9.39` FlatCompat incompatibility).
- **Backups / disaster recovery** and a basic load check.

The findings below are the **original** audit, kept as the historical record. Each P0/P1 is resolved as noted in the table above.

---

## 1. Application overview

| | |
|---|---|
| **What it is** | Multi-tenant ERP for electrical-equipment (transformer) manufacturers — the full project lifecycle: CRM → pipeline → configurator → estimation → quotation → compliance → procurement → manufacturing → testing → documents, plus an "AI assistant" (currently a scripted demo). |
| **Frontend** | Next.js 16 (App Router, React 19), Tailwind v4, lucide-react icons. Server Components + client components. |
| **Backend** | Next.js Server Actions (`app/actions/*`). No REST/GraphQL layer. |
| **Auth** | Custom JWT session cookie (`jose`), `bcryptjs` password hash, `middleware.ts` as the auth wall. Coarse RBAC in `lib/permissions.ts`. |
| **DB / ORM** | Prisma 6 → **SQLite** (hardcoded provider). `tenantId` column on every table (app-level multi-tenancy). |
| **Deploy (current)** | Dockerfile (Next standalone) + `DEPLOYMENT.md`. Targets SQLite dev / "switch to Postgres" for prod. |
| **Tests** | **None.** No unit/integration/e2e, no CI. |

**Architecture is reasonable for its size:** clean separation of `app/actions` (mutations), `lib/data.ts` (reads), `lib/mock/*` (seed/fallback), and UI. The main structural problems are security and data-layer, not layout.

---

## 2. Scorecard (not inflated)

| Area | Score | Why |
|---|---:|---|
| Security | **2/10** | Forgeable sessions, broken authz, no tenant isolation on writes, critical dep CVE |
| Production Readiness | **2/10** | SQLite tmp-copy hack; build step wipes/seeds DB; no `.env`; no logging/monitoring/health check |
| Testing | **0/10** | Zero tests, no CI |
| Database | **4/10** | No indexes, no FK-level tenant scoping, destructive seed, SQLite |
| API (server actions) | **4/10** | Several unguarded actions; errors surface as 500; no rate limiting |
| SEO | **4/10** | No robots/sitemap; thin metadata (mostly N/A — app is auth-gated) |
| Accessibility | **5/10** | Modals lack focus-trap/ARIA; some icon-only buttons unlabeled |
| Architecture | **6/10** | Good layering; silent mock-fallback masks failures |
| Code Quality | **6/10** | Readable, typed; some `any`, hardcoded KPIs, `Math.random` pricing |
| Performance | **6/10** | Fast pages, but no indexes and a few N+1 read loops |
| Business Logic | **6/10** | Lifecycle logic is sound; pricing/benchmarks are partly faked |
| UX | **7/10** | Polished, consistent, good empty/loading handling |
| **Overall** | **≈ 40/100** | **🔴 NOT READY** |

---

## 3. Critical issues (P0 — fix before any deploy)

### [CRITICAL] C-1 · Hardcoded fallback `AUTH_SECRET` → anyone can forge any session
- **Confidence:** Confirmed (reproduced).
- **Location:** `middleware.ts:6`, `lib/auth.ts:8`. No `.env` file exists in the project.
- **Problem:** Both the middleware and the signer fall back to a **literal, source-committed secret** (`"candron-dev-secret-key-please-change-in-production-0192837465"`) when `AUTH_SECRET` is unset. There is no `.env`, so a deploy that forgets the var uses this public string.
- **Repro:** I signed a JWT `{uid:"U-09",tid:"T-CANDRON",lvl:"admin"}` with that exact string and sent it as `candron_session`. `/settings` rendered as **Director "Meera Shah"** — full admin, no login.
- **Impact:** Complete authentication bypass and account/tenant takeover on any instance without `AUTH_SECRET` set. The secret is in the repo, so it's public.
- **Fix:** Remove both fallbacks — `throw` at boot if `AUTH_SECRET` is missing. Require it in the deploy. Rotate to a 48-byte random value. Never commit a default.

### [CRITICAL] C-2 · Critical Next.js CVE in the pinned version
- **Confidence:** Confirmed (`npm audit`).
- **Location:** `package.json` → `next@16.2.12` (installed). Patched in **16.4.0+**.
- **Problem:** `npm audit` reports **1 critical + several high** advisories against this Next.js range, including unauthenticated RCE paths (Windows-hosted, Image Optimization with SVG/AVIF), `next/og` RCE, SSG/ISR cache poisoning, and Server-Action DoS.
- **Impact:** Remote code execution / DoS / cache poisoning depending on host and features.
- **Fix:** Upgrade to the latest patched 16.x (`npm i next@^16.4`). Re-run `npm audit` and also patch `postcss`, `sharp`, `source-map-js`, `nanoid` (7 high).

### [CRITICAL] C-3 · Build step wipes and reseeds the database
- **Confidence:** Confirmed (code).
- **Location:** `package.json:14` → `"build": "npm run db:push && npm run db:seed && next build"`; `prisma/seed.ts:23` deletes **every table** (`deleteMany`) before inserting demo data.
- **Problem:** Every production build runs `db:push` (schema sync) **and** `db:seed`, and the seed starts by deleting all rows. On any host that builds on deploy (Hostinger, Vercel, Docker rebuild), **this destroys all customer data** and replaces it with CANDRON demo records.
- **Impact:** Total, silent data loss on every deploy.
- **Fix:** Remove `db:push && db:seed` from `build`. Use `prisma migrate deploy` as a **separate, explicit** release step. Seed only once, manually, for a demo tenant — never in `build`.

---

## 4. High-priority issues (P1)

### [HIGH] H-1 · Broken authorization — a read-only user can write
- **Confidence:** Confirmed (reproduced).
- **Location:** `app/actions/crm.ts` (`logCommunication`), `app/actions/projects.ts` (`setProjectHealth`), `app/actions/quotations.ts` (`saveQuotationBlocks`) — these have **no `requireUser` / `can()` guard** at all.
- **Repro:** With a **viewer (read-only)** session, I called `logCommunication` against `/customers/C-01`. The communication count went **49 → 50**. A role defined as read-only performed a write.
- **Impact:** Privilege escalation; any authenticated user (any role) can mutate data these actions touch.
- **Fix:** Every mutating action must start with `requireUser()` + the appropriate `can(user, …)` check. Add a shared wrapper so no action can be written without one.

### [HIGH] H-2 · No tenant isolation on writes (IDOR / cross-tenant)
- **Confidence:** Confirmed (code); runtime repro limited only by needing a real 2nd-tenant user row.
- **Location:** `app/actions/execution.ts` (`advanceWorkOrder`, `toggleWorkOrderHold`, `recordTestResult`, `awardPO`, `raiseRFQ`, `advanceRequirement`), `app/actions/projects.ts` (`advanceProjectStage`, `setProjectHealth`), `app/actions/quotations.ts` (`setQuotationStatus`, `reviseQuotation`, `setApprovalStatus`, `saveQuotationBlocks`), `app/actions/config.ts` (`saveConfiguration`, `saveEstimate`).
- **Problem:** These look records up by `prisma.<model>.findUnique({ where: { id } })` and check only the **role**, never that the record's `tenantId` matches the caller's. A legitimate user in tenant B who knows/guesses tenant A's record IDs (IDs are sequential: `PRJ-2026-0142`, `WO-0142-2`, `PO-44xx`) can advance/hold/approve/price A's records.
- **Impact:** Horizontal privilege escalation across tenants — the core promise of a multi-tenant product is violated.
- **Fix:** Scope every lookup by `tenantId: user.tenantId` (use `findFirst({ where:{ id, tenantId }})`) and return a not-found on mismatch. Add a DB index on `(tenantId, id)`.

### [HIGH] H-3 · `logCommunication` ignores the caller and writes to "the first tenant"
- **Confidence:** Confirmed (code).
- **Location:** `app/actions/crm.ts:13` — `tenantId: (await prisma.tenant.findFirst()).id`, `userId: input.userId || "U-01"`.
- **Problem:** The action derives the tenant from `findFirst()` (whichever tenant was created first) and attributes the entry to a hardcoded user `U-01`, not the signed-in user. In a multi-tenant deploy, tenant B's log entries land under tenant A and are mis-attributed.
- **Impact:** Cross-tenant data corruption + false audit trail.
- **Fix:** Use `requireUser()` → `user.tenantId` and `user.id`. Verify the customer belongs to that tenant.

### [HIGH] H-4 · Admin UI shown to unauthorized roles; denials crash as HTTP 500
- **Confidence:** Confirmed (observed).
- **Location:** `components/settings/SettingsClient.tsx` (no `can()`/`accessLevel` gating anywhere); guard pattern in all actions `throw new Error("You don't have permission…")`.
- **Problem:** Logged in as **viewer**, `/settings` renders the full admin panel — Save changes, Make active, Invite user, family toggles. The server actions *do* guard, but a thrown `Error` surfaces to the client as an **unhandled 500**, not a clean "not allowed." (`advanceProjectStage` as viewer → 500, confirmed.)
- **Impact:** Confusing/again-broken UX, 500s in normal use, and it invites the H-1/H-2 bypasses.
- **Fix:** Gate controls in the UI with `can()` (pass perms to the client as the Topbar already does for "New Project"). Return typed `{ok:false, error}` from actions instead of throwing; render the message.

### [HIGH] H-5 · DB errors silently serve fake seed data in production
- **Confidence:** Confirmed (code).
- **Location:** `lib/data.ts` `withFallback()` (used by `getTenant`, `getUsers`, `getCustomers`, `getProjects`, metrics, …).
- **Problem:** Every read wraps the DB call in `try { db } catch { return MOCK }`. If the database is unreachable or a query fails in production, the app **silently returns hardcoded CANDRON mock data** instead of erroring — potentially showing one tenant another tenant's demo data and masking outages.
- **Impact:** Wrong/stale data shown as real; outages invisible; cross-tenant leakage of mock content.
- **Fix:** Remove the mock fallback from production code paths (keep it behind an explicit dev flag only). Let read failures surface to an error boundary.

---

## 5. Medium-priority issues (P2)

| ID | Issue | Location | Fix |
|---|---|---|---|
| M-1 | **SQLite in production via a `/tmp` copy** — data is ephemeral (lost on restart/redeploy) and not shared across instances | `lib/db.ts` `resolveDatabaseUrl`, `next.config.ts` `outputFileTracingIncludes` | Move to MySQL/Postgres (see §7); delete the tmp-copy and the dev.db tracing include |
| M-2 | **No rate limiting / lockout** on login or actions | `app/actions/auth.ts`, middleware | Add per-IP throttle on `signIn`/`registerTenant` and on mutations |
| M-3 | **No DB indexes**; `tenantId`, `projectId`, `customerId` are plain String columns, FK-less | `prisma/schema.prisma` | Add `@@index([tenantId])` etc.; real FKs where possible |
| M-4 | **7 high-severity dep vulns** besides Next (postcss, sharp, source-map-js, nanoid, prisma) | `package.json` | `npm audit fix`, verify build |
| M-5 | **Secure cookie only in prod; no `.env`; demo password `candron123`** seeded for all users | `lib/auth.ts:61`, `prisma/seed.ts` | Ship `.env`; unique seed passwords or invite-only; enforce real password policy (min length only today) |
| M-6 | **`Math.random()` pricing** in RFQ quotes | `app/actions/execution.ts:60` | Replace with a deterministic/real pricing source before quoting to clients |
| M-7 | **Errors leak as 500 with stack** in dev; no error boundary / 404 styling verified | actions throwing; `/does-not-exist` → generic 404 | Add `error.tsx`/`not-found.tsx`; typed action errors |
| M-8 | **No observability** — no structured logging, error tracking, health check, or audit log (the `Activity` table exists but is unused by actions) | app-wide | Add a `/api/health`, logging, Sentry-style tracking; write to `Activity` on mutations |

---

## 6. Low-priority issues (P3)

- **L-1 — Dashboard KPIs are hardcoded**: deltas `12.4%`, `8.1%`, `0.6%`, label `Q3 FY26` in `app/page.tsx` are static strings, not computed. Misleads on real data.
- **L-2 — No tests, no CI.** Zero coverage of auth, authz, lifecycle, or pricing.
- **L-3 — SEO**: no `robots.txt`/`sitemap.xml` (`/robots.txt` → 307 to login); login/register have thin metadata. Mostly N/A (app is auth-gated), but the public pages deserve basic tags.
- **L-4 — Accessibility**: modals (`LogCommButton`, `NewProjectButton`) lack focus-trap and `role="dialog"`/`aria-modal`; several icon-only buttons rely on `title` only; no skip-link. Keyboard/ESC close works via backdrop only.
- **L-5 — `"use cache"`/middleware deprecation**: build warns `middleware` → rename to `proxy` (Next 16 convention).
- **L-6 — TypeScript `any`** in `lib/data.ts` mappers; acceptable but weakens the model.

---

## 7. Deploying on Hostinger with MySQL — what's actually required

You asked to deploy on Hostinger as a web app using MySQL. Important realities first, then the concrete changes.

### 7a. Hosting type — this will NOT run on classic shared hosting
Next.js 16 runs a **Node.js server** (Server Components + Server Actions). Hostinger's **shared / Business web hosting is PHP/Apache** and cannot run a long-lived Node process. You need one of:
- **Hostinger VPS** (recommended) — install Node 22, run `next start` behind Nginx/Apache reverse proxy, keep it alive with **PM2**; or
- Hostinger's **Node.js app hosting** tier if available on your plan.
Confirm your plan supports a persistent Node process before anything else — otherwise the deploy target is wrong.

### 7b. Code changes to switch SQLite → MySQL
1. **`prisma/schema.prisma`** — `datasource db { provider = "mysql" }` (was `sqlite`). Prisma's `Json`, `String @id`, `Float`, `Boolean` all map cleanly to MySQL; no model rewrite needed. Add indexes (M-3).
2. **`lib/db.ts`** — delete the entire SQLite tmp-copy block (`resolveDatabaseUrl`); just use `process.env.DATABASE_URL`.
3. **`next.config.ts`** — remove `outputFileTracingIncludes: { "/*": ["./prisma/dev.db"] }`.
4. **`package.json`** — change `build` to just `next build`. Run schema as a separate release step: `npx prisma migrate deploy` (generate migrations first with `prisma migrate dev` locally). **Do not** run `db:seed` on deploy (C-3).
5. **`.env` on the server** (never committed):
   ```
   DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/oneerp"
   AUTH_SECRET="<48-byte random — openssl rand -base64 48>"
   NODE_ENV=production
   ```
6. **MySQL on Hostinger**: create the database + user in hPanel, allow the app host, set `DATABASE_URL`. Run `prisma migrate deploy` once, then seed a demo tenant manually if desired.
7. **Process**: `npm ci && npm run build && pm2 start "npm start" --name oneerp`, reverse-proxy `:3550` via Nginx, add the Hostinger SSL cert.

> Fix **C-1, C-2, C-3, H-1, H-2** *before* this goes public — MySQL doesn't change any of them; it only makes the data persistent (so the authz holes now matter permanently).

---

## 8. Browser QA summary (what I actually ran)

Built with `next build`, served with `next start -p 3550`, seeded MySQL-equivalent data in SQLite, driven through the in-app browser.

**Works (happy path):**
- Login: empty form → "Email and password are required"; wrong password → "Invalid email or password" (generic — good, no account enumeration); valid viewer login → dashboard. ✓
- Every route renders real seeded data with **no console errors**: `/`, `/projects`, `/customers`, `/customers/C-01`, `/pipeline`, `/configurator` (live BOM/cost), `/estimation` (computed cost drivers + benchmark), `/quotations`, `/compliance`, `/procurement`, `/manufacturing`, `/testing`, `/documents`, `/settings`, Family Studio. ✓
- Unauthenticated `/projects` → 307 redirect to `/login?next=…`. ✓
- Invalid IDs → clean 404 (`/projects/NOPE`, `/customers/NOPE`, `/quotations/NOPE`). ✓

**Broken / confirmed defects (runtime):**
- Forged admin session accepted (C-1).
- Viewer wrote a communication, 49→50 (H-1).
- Viewer sees full admin Settings UI; guarded save → 500 (H-4).
- `/does-not-exist` returns 200 via the `[...slug]` "Coming soon" catch-all rather than 404 (minor).

**Could not fully verify:** cross-tenant write end-to-end (H-2) — blocked only because a second tenant needs a real user row; the code path is unambiguous. Responsive/mobile layout and screen-reader semantics were **not** exercised (screenshots timed out with the app window hidden) — *Unable to verify visually — reason: screenshot rendering unavailable this session.*

---

## 9. Fix roadmap

**Phase 0 — before deployment (blockers):** C-1 (require AUTH_SECRET), C-2 (upgrade Next), C-3 (remove seed/push from build), H-1 (guard the unguarded actions), H-2 (tenant-scope all writes), H-3 (fix logCommunication tenant/user).

**Phase 1 — first 1–3 days:** H-4 (UI gating + typed action errors), H-5 (drop prod mock fallback), M-1 (MySQL switch per §7), M-4 (`npm audit fix`), M-5 (`.env`, passwords).

**Phase 2 — 1–2 weeks:** M-2 rate limiting, M-3 indexes/FKs, M-7 error boundaries, M-8 logging/health/audit-log, L-1 real KPIs, first e2e tests on auth + lifecycle, CI.

**Phase 3 — longer term:** full test suite, accessibility pass, SEO for public pages, replace `Math.random` pricing, observability/alerting, backups & restore drill.

---

## 10. Production checklist (adapted)

```
[ ] AUTH_SECRET required (no fallback) and set on server      (C-1)
[ ] Next.js upgraded ≥16.4; npm audit clean                   (C-2,M-4)
[ ] build = `next build` only; migrate deploy as own step     (C-3)
[ ] Every mutating action: requireUser + can() + tenant scope (H-1,H-2,H-3)
[ ] UI gated by role; actions return typed errors             (H-4)
[ ] Prod reads do not fall back to mock data                  (H-5)
[ ] MySQL on Hostinger; DATABASE_URL set; migrations applied  (M-1,§7)
[ ] Hostinger VPS/Node tier confirmed (not shared hosting)    (§7a)
[ ] Rate limiting on login + mutations                        (M-2)
[ ] Indexes on tenantId/foreign keys                          (M-3)
[ ] .env on server; strong seeded/invite passwords            (M-5)
[ ] Error boundary + 404/500 pages                            (M-7)
[ ] Health check, logging, error tracking, audit log          (M-8)
[ ] Backups configured + restore tested
[ ] Critical e2e tests passing (auth, authz, lifecycle)
[ ] Mobile/responsive + accessibility reviewed
```
