import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TENANT, USERS, CUSTOMERS, MOCK_ACCESS_LEVEL } from "../lib/mock/org";
import { PROJECTS } from "../lib/mock/projects";
import { artifactsForProject } from "../lib/mock/artifacts";
import { OPPORTUNITIES } from "../lib/mock/pipeline";
import { contactsFor, commsFor } from "../lib/mock/crm";
import { VENDORS, requirementsFor } from "../lib/mock/procurement";
import { WORK_ORDERS } from "../lib/mock/manufacturing";
import { TEST_UNITS } from "../lib/mock/testing";
import { getCompliance, projectsWithCompliance } from "../lib/mock/compliance";
import { QUOTATIONS } from "../lib/mock/quotations";
import { WORKFLOWS, STANDARDS, RATE_CARD_HISTORY } from "../lib/mock/settings";
import { FAMILIES } from "../lib/configurator/families";
import { attrCount, RATES, DEFAULT_FACTORS } from "../lib/configurator/model";
import { stageIndex } from "../lib/lifecycle";

const prisma = new PrismaClient();
const T = TENANT.id;

// Set RESET_DB=1 (or pass --reset) to wipe everything and reseed from scratch.
// Default behaviour is idempotent ("firstOrCreate"): it ensures the tenant and
// users exist on every run without touching existing data, and seeds the demo
// content only when the workspace is still empty — safe to run on every deploy.
const RESET = process.env.RESET_DB === "1" || process.argv.includes("--reset");

async function main() {
  if (RESET) {
    // clean (child → parent)
    await prisma.$transaction([
      prisma.testRecord.deleteMany(), prisma.testUnit.deleteMany(),
      prisma.quoteApproval.deleteMany(), prisma.quoteRevision.deleteMany(), prisma.quotation.deleteMany(),
      prisma.artifactLink.deleteMany(), prisma.revision.deleteMany(), prisma.artifact.deleteMany(),
      prisma.projectStage.deleteMany(), prisma.project.deleteMany(),
      prisma.materialReq.deleteMany(), prisma.workOrder.deleteMany(), prisma.complianceItem.deleteMany(),
      prisma.communication.deleteMany(), prisma.contact.deleteMany(), prisma.opportunity.deleteMany(),
      prisma.activity.deleteMany(), prisma.vendor.deleteMany(), prisma.standardRef.deleteMany(),
      prisma.workflowConfig.deleteMany(), prisma.rateCard.deleteMany(), prisma.productFamily.deleteMany(),
      prisma.customer.deleteMany(), prisma.user.deleteMany(), prisma.tenant.deleteMany(),
    ]);
    console.log("RESET_DB: wiped all data.");
  }

  /* ---------- Always ensure the tenant + users (idempotent / firstOrCreate) ---------- */

  if (!(await prisma.tenant.findUnique({ where: { id: TENANT.id } }))) {
    await prisma.tenant.create({ data: { id: TENANT.id, name: TENANT.name, code: TENANT.code, logoText: TENANT.logoText, primaryCurrency: TENANT.primaryCurrency, country: TENANT.country } });
  }

  const passwordHash = await bcrypt.hash("candron123", 10);
  const seedUsers = [
    ...USERS.map((u) => ({ id: u.id, tenantId: T, name: u.name, initials: u.initials, role: u.role, department: u.department, email: u.email, accessLevel: MOCK_ACCESS_LEVEL[u.id] ?? "member" })),
    // Two dedicated accounts for client UAT — one full-access, one read-only.
    { id: "U-CLIENT-ADMIN", tenantId: T, name: "Client Admin", initials: "CA", role: "Administrator", department: "management", email: "client.admin@candron.in", accessLevel: "admin" },
    { id: "U-CLIENT-VIEWER", tenantId: T, name: "Client Reviewer", initials: "CR", role: "Reviewer", department: "sales", email: "client.viewer@candron.in", accessLevel: "viewer" },
  ];
  let created = 0;
  for (const u of seedUsers) {
    // Create only if neither the id nor the email already exists — never overwrite
    // a user whose details or password the client may have changed.
    const exists = await prisma.user.findFirst({ where: { OR: [{ id: u.id }, { email: u.email }] }, select: { id: true } });
    if (!exists) { await prisma.user.create({ data: { ...u, passwordHash } }); created++; }
  }
  console.log(`Users ensured (${created} created, ${seedUsers.length - created} already present).`);

  /* ---------- Demo content: seed only when the workspace is still empty ---------- */

  if ((await prisma.project.count({ where: { tenantId: T } })) > 0) {
    console.log("Demo content already present — skipping.");
    await report();
    return;
  }
  console.log("Empty workspace — seeding demo content…");

  // customers + contacts
  for (const c of CUSTOMERS) {
    await prisma.customer.create({
      data: {
        id: c.id, tenantId: T, name: c.name, type: c.type, city: c.city, state: c.state, country: c.country,
        gstin: c.gstin ?? null, rating: c.rating, since: c.since,
        contacts: { create: contactsFor(c.id).map((ct) => ({ name: ct.name, role: ct.role, email: ct.email, phone: ct.phone, primary: ct.primary ?? false })) },
      },
    });
    await prisma.communication.createMany({ data: commsFor(c.id).map((m) => ({ tenantId: T, customerId: c.id, type: m.type, subject: m.subject, summary: m.summary, userId: m.userId, date: m.date })) });
  }

  // configuration masters
  await prisma.productFamily.createMany({ data: FAMILIES.map((f) => ({ id: f.id, tenantId: T, name: f.name, category: f.category, blurb: f.blurb, attributeCount: attrCount(f), active: true })) });
  // a tenant-authored (data-only) family, to showcase the Family Studio out of the box
  await prisma.productFamily.create({
    data: {
      id: "cast-resin-dry-type", tenantId: T, name: "Cast-Resin Dry-Type Transformer", category: "Dry-Type",
      blurb: "Epoxy cast-resin dry-type transformer · IEC 60076-11", attributeCount: 3, active: true,
      schema: {
        groups: [{ id: "spec", label: "Specification", attributes: [
          { id: "rating", label: "Rated power", type: "number", unit: "MVA", default: 2, min: 0.5, max: 12.5 },
          { id: "primary", label: "Primary voltage", type: "enum", unit: "kV", default: "11", options: [{ value: "11", label: "11" }, { value: "22", label: "22" }, { value: "33", label: "33" }] },
          { id: "iclass", label: "Insulation class", type: "enum", default: "f", options: [{ value: "f", label: "Class F" }, { value: "h", label: "Class H" }] },
        ] }],
        bom: [
          { rateKey: "copper", label: "Copper winding (cast-resin)", category: "Windings", unit: "kg", qtyMode: "perMVA", qty: 380 },
          { rateKey: "crgo", label: "CRGO core", category: "Core", unit: "kg", qtyMode: "perMVA", qty: 420 },
          { rateKey: "steel", label: "Enclosure & frame", category: "Enclosure", unit: "kg", qtyMode: "perMVA", qty: 250 },
          { rateKey: "paint", label: "Epoxy resin & finish", category: "Finish", unit: "kg", qtyMode: "fixed", qty: 60 },
        ],
        mvaAttrId: "rating",
      },
    },
  });
  await prisma.vendor.createMany({ data: VENDORS.map((v) => ({ id: v.id, tenantId: T, name: v.name, category: v.category, rating: v.rating, location: v.location, onTimePct: v.onTimePct })) });
  await prisma.standardRef.createMany({ data: STANDARDS.map((s) => ({ tenantId: s.scope === "tenant" ? T : null, code: s.code, title: s.title, scope: s.scope })) });
  await prisma.workflowConfig.createMany({ data: WORKFLOWS.map((w) => ({ tenantId: T, artifactType: w.artifactType, label: w.label, states: w.states, approvalChain: w.approvalChain })) });
  await prisma.rateCard.createMany({ data: RATE_CARD_HISTORY.map((v, i) => {
    const scale = 1 - i * 0.05; // older cards ran cheaper — copper/CRGO have risen since
    const rates = Object.fromEntries(Object.entries(RATES).map(([k, r]) => [k, { ...r, rate: Math.round(r.rate * scale) }]));
    return { tenantId: T, effectiveFrom: v.effectiveFrom, label: v.label, active: v.active ?? false, rates, factors: DEFAULT_FACTORS as unknown as Record<string, number> };
  }) });

  // pipeline
  await prisma.opportunity.createMany({ data: OPPORTUNITIES.map((o) => ({ id: o.id, tenantId: T, title: o.title, customerId: o.customerId, stage: o.stage, value: o.value, ownerId: o.ownerId, expectedClose: o.expectedClose, source: o.source, projectId: o.projectId ?? null, lastActivity: o.lastActivity })) });

  // projects + stages, then artifacts (+ revisions + links)
  for (const p of PROJECTS) {
    await prisma.project.create({
      data: {
        id: p.id, tenantId: T, title: p.title, customerId: p.customerId, ownerId: p.ownerId,
        currentStage: p.currentStage, health: p.health, priority: p.priority, value: p.value.amount, currency: p.value.currency,
        marginPct: p.marginPct ?? null, createdAt: p.createdAt, targetDelivery: p.targetDelivery ?? null,
        location: p.location, productSummary: p.productSummary, tags: p.tags,
        stages: { create: p.stages.map((s) => ({ key: s.key, state: s.state, order: stageIndex(s.key), startedAt: s.startedAt ?? null, completedAt: s.completedAt ?? null, ownerId: s.ownerId ?? null, note: s.note ?? null })) },
      },
    });
    for (const a of artifactsForProject(p)) {
      await prisma.artifact.create({
        data: {
          id: a.id, tenantId: T, projectId: p.id, type: a.type, title: a.title, status: a.status, stage: a.stage,
          currentRevision: a.currentRevision, ownerId: a.ownerId, updatedAt: a.updatedAt, upstreamStale: a.upstreamStale ?? false,
          meta: (a.meta ?? undefined) as object | undefined,
          revisions: { create: a.revisions.map((r) => ({ rev: r.rev, createdAt: r.createdAt, authorId: r.authorId, changeSummary: r.changeSummary })) },
          links: { create: a.links.map((l) => ({ toArtifactId: l.toArtifactId, type: l.type, atRevision: l.atRevision })) },
        },
      });
    }
  }

  // compliance
  for (const p of projectsWithCompliance()) {
    await prisma.complianceItem.createMany({ data: getCompliance(p.id).map((r) => ({ tenantId: T, projectId: p.id, clause: r.clause, category: r.category, requirement: r.requirement, companySpec: r.companySpec, status: r.status, deviation: r.deviation ?? null, engineerComment: r.engineerComment ?? null, engineerId: r.engineerId })) });
  }

  // quotations
  for (const q of QUOTATIONS) {
    await prisma.quotation.create({
      data: {
        tenantId: T, projectId: q.projectId, customerId: q.customerId, code: q.id, revision: q.revision, status: q.status,
        validityDays: q.validityDays, ownerId: q.ownerId, product: q.product, lineItems: q.lineItems as object,
        packing: q.packing, freight: q.freight, insurance: q.insurance, gstPct: q.gstPct, paymentTerms: q.paymentTerms,
        deliveryWeeks: q.deliveryWeeks, scope: q.scope, exclusions: q.exclusions, terms: q.terms as object, blocks: q.blocks as object,
        createdAt: q.updatedAt, updatedAt: q.updatedAt,
        revisions: { create: q.revisions.map((r) => ({ rev: r.rev, date: r.date, authorId: r.authorId, change: r.change })) },
        approvals: { create: q.approvals.map((a) => ({ role: a.role, userId: a.userId, status: a.status, date: a.date ?? null })) },
      },
    });
  }

  // procurement
  for (const p of PROJECTS.filter((p) => stageIndex(p.currentStage) >= stageIndex("procurement"))) {
    await prisma.materialReq.createMany({ data: requirementsFor(p.id).map((r) => ({ tenantId: T, projectId: p.id, item: r.item, category: r.category, qty: r.qty, unit: r.unit, requiredBy: r.requiredBy, vendorId: r.vendorId, poNo: r.poNo ?? null, status: r.status, value: r.value })) });
  }

  // manufacturing
  await prisma.workOrder.createMany({ data: WORK_ORDERS.map((w) => ({ id: w.id, tenantId: T, projectId: w.projectId, projectShort: w.projectShort, unit: w.unit, stage: w.stage, operator: w.operator, machine: w.machine, startedAt: w.startedAt, progress: w.progress, status: w.status, issue: w.issue ?? null })) });

  // testing
  for (const u of TEST_UNITS) {
    await prisma.testUnit.create({
      data: {
        tenantId: T, projectId: u.projectId, serial: u.serial, projectShort: u.projectShort, product: u.product, certIssued: u.certIssued, issuedAt: u.issuedAt ?? null,
        tests: { create: u.tests.map((t) => ({ name: t.name, category: t.category, result: t.result, value: t.value ?? null, limit: t.limit ?? null, engineerId: t.engineerId, witnessed: t.witnessed ?? false })) },
      },
    });
  }

  await report();
}

async function report() {
  const counts = {
    users: await prisma.user.count(), projects: await prisma.project.count(), artifacts: await prisma.artifact.count(),
    customers: await prisma.customer.count(), quotations: await prisma.quotation.count(),
    opportunities: await prisma.opportunity.count(), workOrders: await prisma.workOrder.count(),
    tests: await prisma.testRecord.count(), compliance: await prisma.complianceItem.count(),
  };
  console.log("Seed complete:", counts);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
