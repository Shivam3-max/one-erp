import { cache } from "react";
import { prisma } from "./db";
import { stageIndex } from "./lifecycle";
import { currentTenantId } from "./auth";
import type {
  Tenant, User, Customer, Project, Artifact, ProjectStage, StageKey, StageState,
  ArtifactType, ArtifactStatus, ProjectHealth, ProjectPriority, CustomerType,
} from "./types";

/* ---------------- masters (cached per request) ---------------- */

export const getTenant = cache(async (): Promise<Tenant> => {
  const t = await prisma.tenant.findUnique({ where: { id: await currentTenantId() } });
  return t as unknown as Tenant;
});

export const getUsers = cache(async (): Promise<User[]> => {
  const rows = await prisma.user.findMany({ where: { tenantId: await currentTenantId() }, orderBy: { id: "asc" } });
  return rows as unknown as User[];
});

export const getUserMap = cache(async (): Promise<Record<string, User>> => {
  const users = await getUsers();
  return Object.fromEntries(users.map((u) => [u.id, u]));
});

export const getCustomers = cache(async (): Promise<Customer[]> => {
  const rows = await prisma.customer.findMany({ where: { tenantId: await currentTenantId() }, orderBy: { id: "asc" } });
  return rows as unknown as Customer[];
});

export const getCustomerMap = cache(async (): Promise<Record<string, Customer>> => {
  const cs = await getCustomers();
  return Object.fromEntries(cs.map((c) => [c.id, c]));
});

export async function getCustomer(id: string): Promise<Customer | undefined> {
  const c = await prisma.customer.findUnique({ where: { id } });
  return (c as unknown as Customer) ?? undefined;
}

/* ---------------- projects ---------------- */

function mapProject(p: any): Project {
  return {
    id: p.id, tenantId: p.tenantId, title: p.title, customerId: p.customerId, ownerId: p.ownerId,
    currentStage: p.currentStage as StageKey, health: p.health as ProjectHealth, priority: p.priority as ProjectPriority,
    value: { amount: p.value, currency: p.currency }, marginPct: p.marginPct ?? undefined,
    createdAt: p.createdAt, targetDelivery: p.targetDelivery ?? undefined, location: p.location,
    tags: (p.tags ?? []) as string[], productSummary: p.productSummary,
    stages: (p.stages ?? []).sort((a: any, b: any) => a.order - b.order).map((s: any): ProjectStage => ({
      key: s.key as StageKey, state: s.state as StageState, startedAt: s.startedAt ?? undefined,
      completedAt: s.completedAt ?? undefined, ownerId: s.ownerId ?? undefined, note: s.note ?? undefined, artifactIds: [],
    })),
  };
}

export const getProjects = cache(async (): Promise<Project[]> => {
  const rows = await prisma.project.findMany({ where: { tenantId: await currentTenantId() }, include: { stages: true }, orderBy: { createdAt: "desc" } });
  return rows.map(mapProject);
});

export async function getProject(id: string): Promise<Project | undefined> {
  const p = await prisma.project.findUnique({ where: { id }, include: { stages: true } });
  return p ? mapProject(p) : undefined;
}

/* ---------------- artifacts ---------------- */

function mapArtifact(a: any): Artifact {
  return {
    id: a.id, tenantId: a.tenantId, projectId: a.projectId, type: a.type as ArtifactType, title: a.title,
    status: a.status as ArtifactStatus, stage: a.stage as StageKey, currentRevision: a.currentRevision,
    revisions: (a.revisions ?? []).sort((x: any, y: any) => x.rev - y.rev).map((r: any) => ({ rev: r.rev, createdAt: r.createdAt, authorId: r.authorId, changeSummary: r.changeSummary })),
    links: (a.links ?? []).map((l: any) => ({ toArtifactId: l.toArtifactId, type: l.type, atRevision: l.atRevision })),
    ownerId: a.ownerId, updatedAt: a.updatedAt, upstreamStale: a.upstreamStale, meta: a.meta ?? undefined,
  };
}

export async function getArtifacts(projectId: string): Promise<Artifact[]> {
  const rows = await prisma.artifact.findMany({ where: { projectId }, include: { revisions: true, links: true } });
  return rows.map(mapArtifact);
}

async function allArtifacts(): Promise<Artifact[]> {
  const rows = await prisma.artifact.findMany({ where: { tenantId: await currentTenantId() }, include: { revisions: true, links: true } });
  return rows.map(mapArtifact);
}

/* ---------------- portfolio metrics ---------------- */

const PO_INDEX = stageIndex("purchase-order");

export async function getPortfolioMetrics() {
  const projects = await getProjects();
  let pipelineValue = 0, orderBook = 0, atRiskCount = 0, marginSum = 0, marginN = 0;
  for (const p of projects) {
    const idx = stageIndex(p.currentStage);
    if (idx < PO_INDEX) pipelineValue += p.value.amount;
    else if (p.health !== "closed") orderBook += p.value.amount;
    if (p.health === "at-risk" || p.health === "critical") atRiskCount++;
    if (p.marginPct != null) { marginSum += p.marginPct; marginN++; }
  }
  const staleCount = await prisma.artifact.count({ where: { upstreamStale: true, tenantId: await currentTenantId() } });
  return {
    pipelineValue, orderBook, activeCount: projects.filter((p) => p.health !== "closed").length,
    atRiskCount, avgMargin: marginN ? marginSum / marginN : 0, staleCount,
    wonThisQuarter: projects.filter((p) => stageIndex(p.currentStage) >= PO_INDEX).length,
  };
}

export async function getStageDistribution() {
  const { LIFECYCLE } = await import("./lifecycle");
  const projects = await getProjects();
  return LIFECYCLE.map((meta) => {
    const at = projects.filter((p) => p.currentStage === meta.key);
    return { key: meta.key, label: meta.label, count: at.length, value: at.reduce((s, p) => s + p.value.amount, 0) };
  });
}

export async function getStaleArtifacts() {
  const rows = await prisma.artifact.findMany({ where: { upstreamStale: true, tenantId: await currentTenantId() }, include: { revisions: true, links: true } });
  const projects = await getProjects();
  const byId = Object.fromEntries(projects.map((p) => [p.id, p]));
  return rows.map((a) => ({ artifact: mapArtifact(a), project: byId[a.projectId] })).filter((x) => x.project);
}

export async function getActivityFeed(limit = 12) {
  const arts = await allArtifacts();
  const projects = await getProjects();
  const byId = Object.fromEntries(projects.map((p) => [p.id, p]));
  const items = arts.map((a) => {
    const last = a.revisions[a.revisions.length - 1];
    return {
      id: `${a.id}-${last?.rev ?? 1}`, projectId: a.projectId, projectTitle: byId[a.projectId]?.title ?? "",
      actorId: last?.authorId ?? a.ownerId, summary: last?.changeSummary ?? "updated",
      artifactId: a.id, artifactType: a.type, at: a.updatedAt, stale: a.upstreamStale,
    };
  });
  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, limit);
}

/* ---------------- sales / pipeline ---------------- */

export async function getOpportunities() {
  const rows = await prisma.opportunity.findMany({ where: { tenantId: await currentTenantId() } });
  return rows.map((o) => ({
    id: o.id, tenantId: o.tenantId, title: o.title, customerId: o.customerId, stage: o.stage,
    value: o.value, ownerId: o.ownerId, expectedClose: o.expectedClose, source: o.source,
    projectId: o.projectId ?? undefined, lastActivity: o.lastActivity,
  }));
}

/* ---------------- CRM ---------------- */

export async function getContactsFor(customerId: string) {
  const rows = await prisma.contact.findMany({ where: { customerId } });
  return rows.map((c) => ({ name: c.name, role: c.role, email: c.email, phone: c.phone, primary: c.primary }));
}

export async function getCommsFor(customerId: string) {
  const rows = await prisma.communication.findMany({ where: { customerId }, orderBy: { date: "desc" } });
  return rows.map((m) => ({ id: m.id, type: m.type as "email" | "call" | "meeting" | "site-visit", subject: m.subject, summary: m.summary, userId: m.userId, date: m.date }));
}

/* ---------------- quotations ---------------- */

function mapQuote(q: any) {
  return {
    id: q.code, projectId: q.projectId, customerId: q.customerId, revision: q.revision, status: q.status,
    validityDays: q.validityDays, updatedAt: q.updatedAt, ownerId: q.ownerId, product: q.product,
    lineItems: q.lineItems, packing: q.packing, freight: q.freight, insurance: q.insurance, gstPct: q.gstPct,
    paymentTerms: q.paymentTerms, deliveryWeeks: q.deliveryWeeks, scope: q.scope, exclusions: q.exclusions,
    terms: q.terms, blocks: q.blocks,
    revisions: (q.revisions ?? []).sort((a: any, b: any) => a.rev - b.rev).map((r: any) => ({ rev: r.rev, date: r.date, authorId: r.authorId, change: r.change })),
    approvals: (q.approvals ?? []).map((a: any) => ({ role: a.role, userId: a.userId, status: a.status, date: a.date ?? undefined })),
  };
}

export async function getQuotations() {
  const rows = await prisma.quotation.findMany({ where: { tenantId: await currentTenantId() }, include: { revisions: true, approvals: true } });
  return rows.map(mapQuote);
}

export async function getQuotationByProject(projectId: string) {
  const q = await prisma.quotation.findUnique({ where: { projectId }, include: { revisions: true, approvals: true } });
  return q ? mapQuote(q) : undefined;
}

/* ---------------- compliance ---------------- */

export async function getComplianceItems(projectId: string) {
  const rows = await prisma.complianceItem.findMany({ where: { projectId } });
  return rows.map((r) => ({ id: r.id, clause: r.clause, category: r.category, requirement: r.requirement, companySpec: r.companySpec, status: r.status as any, deviation: r.deviation ?? undefined, engineerComment: r.engineerComment ?? undefined, engineerId: r.engineerId }));
}

export async function getProjectsWithCompliance() {
  const items = await prisma.complianceItem.findMany({ where: { tenantId: await currentTenantId() }, select: { projectId: true }, distinct: ["projectId"] });
  const ids = items.map((i) => i.projectId);
  const projects = await prisma.project.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } });
  return projects;
}

/* ---------------- procurement ---------------- */

export async function getRequirements(projectId: string) {
  const rows = await prisma.materialReq.findMany({ where: { projectId } });
  return rows.map((r) => ({ id: r.id, item: r.item, category: r.category, qty: r.qty, unit: r.unit, requiredBy: r.requiredBy, vendorId: r.vendorId, poNo: r.poNo ?? undefined, status: r.status as any, value: r.value, quotes: (r.quotes as { vendorId: string; vendorName: string; price: number; leadWeeks: number }[] | null) ?? undefined }));
}

export async function getVendors() {
  const rows = await prisma.vendor.findMany({ where: { tenantId: await currentTenantId() } });
  return rows.map((v) => ({ id: v.id, name: v.name, category: v.category, rating: v.rating as "A" | "B", location: v.location, onTimePct: v.onTimePct }));
}

export async function getProjectsForProcurement() {
  const projects = await getProjects();
  return projects.filter((p) => stageIndex(p.currentStage) >= stageIndex("procurement")).map((p) => ({ id: p.id, title: p.title }));
}

/* ---------------- manufacturing ---------------- */

export async function getWorkOrders() {
  const rows = await prisma.workOrder.findMany({ where: { tenantId: await currentTenantId() } });
  return rows.map((w) => ({ id: w.id, projectId: w.projectId, projectShort: w.projectShort, unit: w.unit, stage: w.stage as any, operator: w.operator, machine: w.machine, startedAt: w.startedAt, progress: w.progress, status: w.status as any, issue: w.issue ?? undefined }));
}

/* ---------------- testing ---------------- */

export async function getTestUnits() {
  const rows = await prisma.testUnit.findMany({ where: { tenantId: await currentTenantId() }, include: { tests: true } });
  return rows.map((u) => ({
    serial: u.serial, projectId: u.projectId, projectShort: u.projectShort, product: u.product, certIssued: u.certIssued, issuedAt: u.issuedAt ?? undefined,
    tests: u.tests.map((t) => ({ id: t.id, name: t.name, category: t.category as any, result: t.result as any, value: t.value ?? undefined, limit: t.limit ?? undefined, engineerId: t.engineerId, witnessed: t.witnessed })),
  }));
}

/* ---------------- settings masters ---------------- */

export async function getFamilies() {
  const rows = await prisma.productFamily.findMany({ where: { tenantId: await currentTenantId() } });
  return rows.map((f) => ({ id: f.id, name: f.name, category: f.category, blurb: f.blurb, attributeCount: f.attributeCount, active: f.active }));
}

export async function getWorkflows() {
  const rows = await prisma.workflowConfig.findMany({ where: { tenantId: await currentTenantId() } });
  return rows.map((w) => ({ artifactType: w.artifactType, label: w.label, states: w.states as string[], approvalChain: w.approvalChain as string[] }));
}

export async function getStandards() {
  const rows = await prisma.standardRef.findMany({ where: { OR: [{ tenantId: null }, { tenantId: await currentTenantId() }] } });
  return rows.map((s) => ({ code: s.code, title: s.title, scope: s.scope as "global" | "tenant" }));
}

export async function getRateCards() {
  const rows = await prisma.rateCard.findMany({ where: { tenantId: await currentTenantId() }, orderBy: { effectiveFrom: "desc" } });
  return rows.map((r) => ({ effectiveFrom: r.effectiveFrom, label: r.label, active: r.active, rates: r.rates as Record<string, { label: string; rate: number; unit: string }> }));
}

export { stageIndex };
