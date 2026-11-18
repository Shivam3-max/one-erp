# CANDRON OneERP — Client Testing SOP

A standard procedure for a client to validate the application in a test
environment. Follow it top to bottom; each step has an expected result and a
pass/fail box.

> **Test accounts** (password `candron123` for both — created by the seed; see
> §2). Rotate or disable these before real production use.
>
> | Account | Email | Access | Use it to test |
> |---|---|---|---|
> | Client Admin | `client.admin@candron.in` | Full (admin) | Create/edit, approvals, settings, the full workflow |
> | Client Reviewer | `client.viewer@candron.in` | Read-only (viewer) | That restricted users can view but not change anything |
>
> On the sign-in page these appear as one-click buttons: **Client Admin** and
> **Client Reviewer · read-only**.

---

## 1. Scope

Confirm the application works end-to-end for a real user on the client's
infrastructure: sign-in, the core project lifecycle, documents and approvals,
role-based access, and that nothing errors or leaks across tenants.

## 2. Prerequisites (one-time, by the deploying engineer)

1. **MySQL** database created in Hostinger hPanel (note the DB name + user — they
   are usually prefixed, e.g. `u1234567_oneerp`).
2. **Environment** (`.env`) set — use the discrete variables:
   ```bash
   DB_HOST="localhost"
   DB_PORT="3306"
   DB_NAME="u1234567_oneerp"
   DB_USER="u1234567_oneerp"
   DB_PASSWORD="…"
   AUTH_SECRET="…"            # openssl rand -base64 48
   ```
   (A full `DATABASE_URL` may be used instead; it takes precedence.)
3. **Build & run:**
   ```bash
   npm ci
   npm run build
   npm run start:prod     # migrations + idempotent seed run automatically on boot
   ```
   Migrations and the seed (tenant, users + demo data when empty) run on every
   boot — no manual step. The two client test users are created automatically.
4. Confirm health: open `/api/health` → expect `{"status":"ok","db":"up"}`.

> To wipe and reseed from scratch (destructive — demo only): `npm run db:reset`.

## 3. Test script

Sign in with **Client Admin** unless a step says otherwise. Tick each box.

### 3.1 Authentication
- [ ] Open the app → you are redirected to **/login**.
- [ ] Wrong password → "Invalid email or password." (no app crash).
- [ ] Sign in as **Client Admin** → the **Overview** dashboard loads with KPIs
      (Order Book, Live Pipeline, Active Projects, Avg Margin).
- [ ] Click your avatar → **Sign out** → back to /login.

### 3.2 Create and advance a project
- [ ] Sign in as Client Admin → click **New Project**.
- [ ] Fill title, customer, product, location, value → **Create project**.
- [ ] You land on the new project page; it shows **Stage 1 of 22 · Lead**.
- [ ] Click **Advance →** → the stage moves to **Qualification** (2 of 22).
- [ ] Reload the page → the change persisted.

### 3.3 Quotation
- [ ] Go to **Quotations** → open a project's quotation (or generate one).
- [ ] The document shows line items, taxes and a grand total that add up.
- [ ] As an approver, set an approval status → it updates and is reflected.

### 3.4 Operations (procurement / manufacturing / testing)
- [ ] **Procurement** → raise an RFQ on a requirement → vendor quotes appear;
      award a PO → status moves to "PO".
- [ ] **Manufacturing** → generate/advance a work order → progress increases.
- [ ] **Testing** → record test results. When **all** tests on a unit pass, a
      certificate is issued; mark one as **fail** → the certificate is revoked.

### 3.5 CRM
- [ ] **Customers** → open a customer → **Log** a communication → it appears in
      the timeline immediately.

### 3.6 Role-based access (sign in as **Client Reviewer**)
- [ ] The **New Project** button is **not** shown.
- [ ] **Settings** shows a "read-only access" notice and controls are disabled.
- [ ] You can open and read projects, customers, quotations — but cannot change
      anything.

### 3.7 Robustness
- [ ] Visit a made-up URL, e.g. `/projects/PRJ-DOES-NOT-EXIST` → a friendly
      **"Page not found"** page (not a crash).
- [ ] Use the browser Back/Forward and refresh during the flows → no broken state.

### 3.8 Responsive (optional)
- [ ] Resize to a phone width → navigation and forms remain usable; no content
      is cut off or horizontally scrolling.

## 4. Reporting issues

For any failed box, record: **page/URL**, **steps**, **what you expected**,
**what happened**, and a screenshot or the browser console error if visible.

## 5. After testing

- Rotate or disable the two client test accounts (`client.admin@…`,
  `client.viewer@…`) and the other demo accounts before go-live.
- Set a fresh `AUTH_SECRET` for production and keep it out of version control.
- See `DEPLOYMENT.md` for the production deploy and `AUDIT.md` for the current
  readiness status and remaining fast-follows.
