import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TENANT, USERS, CUSTOMERS } from "../lib/mock/org";
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
import { attrCount, RATES } from "../lib/configurator/model";
import { stageIndex } from "../lib/lifecycle";

const prisma = new PrismaClient();
const T = TENANT.id;

async function main() {
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

  await prisma.tenant.create({ data: { id: TENANT.id, name: TENANT.name, code: TENANT.code, logoText: TENANT.logoText, primaryCurrency: TENANT.primaryCurrency, country: TENANT.country } });

  const passwordHash = await bcrypt.hash("candron123", 10);
  const LEVEL: Record<string, string> = { "U-09": "admin", "U-05": "manager", "U-01": "manager" };
  await prisma.user.createMany({ data: USERS.map((u) => ({ id: u.id, tenantId: T, name: u.name, initials: u.initials, role: u.role, department: u.department, email: u.email, passwordHash, accessLevel: LEVEL[u.id] ?? "member" })) });
  await prisma.user.create({ data: { id: "U-10", tenantId: T, name: "Guest Viewer", initials: "GV", role: "Viewer", department: "sales", email: "viewer@candron.in", passwordHash, accessLevel: "viewer" } });

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
  await prisma.vendor.createMany({ data: VENDORS.map((v) => ({ id: v.id, tenantId: T, name: v.name, category: v.category, rating: v.rating, location: v.location, onTimePct: v.onTimePct })) });
  await prisma.standardRef.createMany({ data: STANDARDS.map((s) => ({ tenantId: s.scope === "tenant" ? T : null, code: s.code, title: s.title, scope: s.scope })) });
  await prisma.workflowConfig.createMany({ data: WORKFLOWS.map((w) => ({ tenantId: T, artifactType: w.artifactType, label: w.label, states: w.states, approvalChain: w.approvalChain })) });
  await prisma.rateCard.createMany({ data: RATE_CARD_HISTORY.map((v) => ({ tenantId: T, effectiveFrom: v.effectiveFrom, label: v.label, active: v.active ?? false, rates: v.active ? RATES : {} })) });

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

  const counts = {
    projects: await prisma.project.count(), artifacts: await prisma.artifact.count(),
    customers: await prisma.customer.count(), quotations: await prisma.quotation.count(),
    opportunities: await prisma.opportunity.count(), workOrders: await prisma.workOrder.count(),
    tests: await prisma.testRecord.count(), compliance: await prisma.complianceItem.count(),
  };
  console.log("Seed complete:", counts);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
