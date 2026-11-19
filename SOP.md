# CANDRON OneERP — Standard Operating Procedure (End to End)

The complete operating procedure for running a project through OneERP, from first
configuring the workspace to issuing the test certificate and closing out —
following the same lifecycle spine every project travels.

Each step lists **who** does it, **where** it is, the **action**, and the
**result**. Everything you create attaches to its project automatically.

**Companion docs:** `HANDOVER.md` (module reference), `DEPLOYMENT.md` (hosting),
`AUDIT.md` (readiness).

---

## 0. Access & roles

- **URL:** your deployed address (e.g. `https://erp.candron.com/`). Visitors are
  sent to `/login`.
- **Sign in** with email + password. The two UAT accounts (password `candron123`):
  - **Client Admin** — `client.admin@candron.in` (full access)
  - **Client Reviewer** — `client.viewer@candron.in` (read-only)
- **Roles:** Administrator/Director (everything) · Manager (everything except
  Settings; can issue/approve quotations) · Member (operate, create quotations,
  but not issue/approve) · Viewer (read-only). Controls you can't use are hidden.

> Deploys migrate and seed automatically (tenant + users); no demo data is loaded
> in production. Rotate/disable the test accounts before real use.

---

## Phase A — Configure the workspace (one-time, Administrator)

Do this once before running live projects. **Settings** (left nav → Settings).

| # | Tab | Action | Result |
|---|---|---|---|
| A1 | Organization | Set company name, country, currency, logo text, brand colour. | The app is branded for your company. |
| A2 | Rate Cards | Create a rate card, enter current material rates + cost factors, **Make active**. | All costing uses this active card. |
| A3 | Commercial | Set default margin, dealer %, risk %, freight/packing/insurance %, GST, payment terms, validity, warranty, loss-capitalisation rates. | Default commercial terms for every quotation. |
| A4 | Quotation | Set the standard scope, exclusions and terms/clauses. | The quotation template. |
| A5 | Standards | Add the IS/IEC standards you quote against. | The standards library. |
| A6 | Product Families | Enable the built-in families and/or open **Family Studio** to author your own product as data (attributes + BOM rules → live cost). | Products available in the Configurator. |
| A7 | Team & Roles | Invite your users and assign roles. | Your team can sign in. |

Then add your **Customers** (Sales → Customers → add customer + contacts, and any
per-customer commercial overrides).

---

## Phase B — Capture the inquiry → create the project

**Sales / Member+**

1. Top bar → **New Project**.
2. Enter title, customer, product summary, location, value (₹ Cr), priority,
   target delivery → **Create project**.
3. **Result:** a project ID (e.g. `PRJ-2026-0001`) opens at **Stage 1 · Lead**,
   with all 22 lifecycle stages laid out.
4. Log the first contact: **Customers → the customer → Communication → Log**
   (email / call / meeting / site-visit).

**Advance the stage** at any point: on the project page click **Advance →
<next stage>**. The spine moves one stage forward (Lead → Qualification → RFQ …).

---

## Phase C — Engineer the product

### C1. Configure the product · *Engineering / Member+*
1. **Configurator** → pick the product family.
2. Set the attributes (rated power, primary/secondary voltage, winding, quantity…).
   The **BOM, live cost and datasheet** compile instantly as you change inputs.
3. **Save to project** → choose the project.
4. **Result:** a **Configuration** artifact is added to the project spine.

### C2. Estimate the cost · *Engineering / Member+*
1. **Estimation** → choose the basis (family, rating, voltages, winding, quantity).
2. Review the **cost drivers** (windings, core, oil, tank…) and the **benchmark**
   against similar delivered units (expected landed cost vs estimate).
3. **Save estimate** → choose the project.
4. **Result:** a **Cost Sheet** artifact is added.

### C3. Compliance matrix · *Engineering*
1. **Compliance** → for the project, map each tender requirement to the **company
   specification** and mark **comply / deviate**, with a note on each gap.
2. **Result:** flagged deviations carry into the quotation.

---

## Phase D — Quote and win

### D1. Create the quotation · *Commercial / Member+*
1. **Quotations** → generate for the project.
2. **Result:** a draft offer (`CAN/Q/2026/…`) built from the project's product,
   value and commercial terms — line items, packing/freight/insurance, GST,
   scope, exclusions, terms, and the approval chain (Sales → Engineering →
   Commercial → Director). Effective terms = workspace defaults + customer overrides.

### D2. Review, approve, issue · *Approvals/issue: Manager+*
1. Open the quotation; toggle the content **blocks** (cover letter, commercial,
   technical, compliance, scope, exclusions, drawings, terms, revision history).
2. Each approver sets **approved / pending / rejected**.
3. When **all approvals are approved** → the quotation becomes **Issued**. Any
   **rejection** returns it to **Draft**.
4. **Revise** when needed → creates the next revision (R2, R3…) with a change note;
   the revision history is kept.

### D3. Negotiate → order · *Sales / Commercial*
- On win, **Advance** the project through **Negotiation → Purchase Order →
  Engineering Approval**.

---

## Phase E — Procure

**Procurement / Manager · Member+** — **Procurement**

1. The project's **material requirements** are listed (exploded from the BOM).
2. **Raise RFQ** on a requirement → vendor quotes are generated for comparison
   (status → *RFQ*). Add approved vendors to the panel as needed.
3. **Award PO** to the best vendor → a PO number is assigned (status → *PO*).
4. On delivery, **advance** the requirement to *Received*.

---

## Phase F — Manufacture

**Manufacturing / Manager · Member+** — **Manufacturing**

1. **Generate work orders** for the project → one set per unit (core, winding,
   tank, assembly).
2. **Advance** each work order as it progresses (0 → 25 → 50 → 75 → 100 = done).
3. Put a work order **on hold** / resume when blocked (e.g. awaiting a drawing).

---

## Phase G — Test & certify

**Quality / Manager · Member+** — **Testing & QA**

1. **Generate test plan** for the project → a serialised test unit with **routine
   + type tests** (all *pending*).
2. Record each test **pass / fail** as it is witnessed.
3. **When every test passes → a test certificate is issued automatically** (dated),
   tied to the unit serial number. If any test is later marked *fail* (or reset to
   *pending*), the certificate is **revoked**.

---

## Phase H — Deliver & close

- **Advance** the project through **Packing → Dispatch → Installation →
  Commissioning → Warranty** (and **AMC → Repeat Business**).
- Every artifact produced along the way is versioned and visible in **Documents**,
  and **Traceability alerts** flag any downstream document whose source revision
  changed — review and re-issue before release.

---

## Verification checklist (acceptance / UAT)

Run once to confirm the deployment. Sign in as **Client Admin** unless noted.

### Access
- [ ] App redirects to `/login`; wrong password shows "Invalid email or password".
- [ ] Sign in → **Overview** loads (KPIs; empty "workspace is ready" state before any data).
- [ ] Sign out returns to `/login`.

### Configuration (Phase A)
- [ ] Set branding, an **active rate card**, commercial terms, quotation template, standards; invite a user.
- [ ] Add a customer with a contact.

### Project lifecycle (Phases B–H)
- [ ] Create a project → opens at **Lead**; **Advance** moves it a stage and persists on reload.
- [ ] Configurator compiles a BOM/cost → **Save to project** adds a Configuration.
- [ ] Estimation saves a Cost Sheet.
- [ ] Compliance matrix records comply/deviate.
- [ ] Quotation generated → approvals set → **Issued**; a **Revise** creates R2.
- [ ] Procurement: raise RFQ → **Award PO**.
- [ ] Manufacturing: generate + advance a work order.
- [ ] Testing: all tests pass → **certificate issued**; mark one fail → certificate **revoked**.
- [ ] Log a communication → appears in the customer timeline.

### Access control & robustness
- [ ] As **Client Reviewer** (read-only): no **New Project** button; **Settings** is read-only; can view but not change.
- [ ] A made-up URL (`/projects/PRJ-XXXX`) shows a friendly **not-found** page.
- [ ] `/api/health` → `{"status":"ok","db":"up"}`.

## Reporting & go-live

- For any failed step record: page/URL, steps, expected vs actual, and a screenshot
  or console error.
- Before go-live: rotate/disable the test accounts, confirm `AUTH_SECRET` is set
  and private, and schedule MySQL backups with a tested restore. See `DEPLOYMENT.md`.
