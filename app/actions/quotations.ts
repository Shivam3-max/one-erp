"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can, type Perm } from "@/lib/permissions";
import { getCommercialConfig, getQuoteTemplate } from "@/lib/data";
import { effectiveCommercial, type CustomerCommercial } from "@/lib/commercial";

const today = () => new Date().toISOString().slice(0, 10);

async function authorize(perm: Perm) {
  const user = await requireUser();
  if (!can(user, perm)) throw new Error("You don't have permission to perform this action.");
  return user;
}

export async function setApprovalStatus(projectId: string, role: string, status: "approved" | "pending" | "rejected") {
  const user = await authorize("quotation.approve");
  const q = await prisma.quotation.findFirst({ where: { projectId, tenantId: user.tenantId }, include: { approvals: true } });
  if (!q) return { ok: false };
  const appr = q.approvals.find((a: { role: string }) => a.role === role);
  if (!appr) return { ok: false };
  await prisma.quoteApproval.update({ where: { id: appr.id }, data: { status, date: status === "pending" ? null : today() } });
  // if any step rejected, revert quote to draft; if all approved, mark issued
  const fresh = await prisma.quoteApproval.findMany({ where: { quotationId: q.id } });
  if (fresh.some((a: { status: string }) => a.status === "rejected")) {
    await prisma.quotation.update({ where: { id: q.id }, data: { status: "draft", updatedAt: today() } });
  } else if (fresh.every((a: { status: string }) => a.status === "approved") && q.status === "draft") {
    await prisma.quotation.update({ where: { id: q.id }, data: { status: "issued", updatedAt: today() } });
  }
  revalidatePath(`/quotations/${projectId}`);
  revalidatePath("/quotations");
  return { ok: true, status };
}

export async function setQuotationStatus(projectId: string, status: string) {
  const user = await authorize("quotation.issue");
  const res = await prisma.quotation.updateMany({ where: { projectId, tenantId: user.tenantId }, data: { status, updatedAt: today() } });
  if (res.count === 0) return { ok: false, reason: "not-found" };
  revalidatePath(`/quotations/${projectId}`);
  revalidatePath("/quotations");
  revalidatePath("/");
  return { ok: true, status };
}

export async function reviseQuotation(projectId: string, change: string) {
  const user = await authorize("quotation.issue");
  const q = await prisma.quotation.findFirst({ where: { projectId, tenantId: user.tenantId } });
  if (!q) return { ok: false };
  const nextRev = q.revision + 1;
  const now = today();
  await prisma.quotation.update({
    where: { projectId },
    data: {
      revision: nextRev,
      status: "revised",
      updatedAt: now,
      revisions: { create: [{ rev: nextRev, date: now, authorId: "U-05", change: change || `Revised to R${nextRev}.` }] },
    },
  });
  revalidatePath(`/quotations/${projectId}`);
  revalidatePath("/quotations");
  return { ok: true, revision: nextRev };
}

export async function saveQuotationBlocks(projectId: string, blocks: { type: string; title: string; included: boolean }[]) {
  const user = await authorize("quotation.issue");
  const res = await prisma.quotation.updateMany({ where: { projectId, tenantId: user.tenantId }, data: { blocks } });
  if (res.count === 0) return { ok: false, reason: "not-found" };
  revalidatePath(`/quotations/${projectId}`);
  return { ok: true };
}

const ALL_BLOCKS = [
  { type: "cover-letter", title: "Cover Letter" }, { type: "commercial-offer", title: "Commercial Offer" },
  { type: "technical-offer", title: "Technical Offer" }, { type: "compliance-matrix", title: "Compliance Matrix" },
  { type: "scope", title: "Scope of Supply" }, { type: "exclusions", title: "Exclusions" },
  { type: "drawings", title: "Drawings & Datasheets" }, { type: "commercial-terms", title: "Commercial Terms" },
  { type: "revision-history", title: "Revision History" },
];

/** Build & persist a quotation from a project's data (for projects without one yet). */
export async function createQuotationForProject(projectId: string) {
  const user = await authorize("quotation.create");
  const existing = await prisma.quotation.findUnique({ where: { projectId } });
  if (existing) return { ok: false, reason: "exists" };
  const p = await prisma.project.findFirst({ where: { id: projectId, tenantId: user.tenantId } });
  if (!p) return { ok: false, reason: "no-project" };

  const tenantId = user.tenantId;
  const now = today();
  const num = projectId.split("-").pop() ?? "0000";
  const qtyMatch = p.productSummary.match(/^(\d+)\s*[×x]/);
  const qty = qtyMatch ? Number(qtyMatch[1]) : 1;

  // effective commercial terms = tenant defaults + this customer's overrides
  const base = await getCommercialConfig();
  const tpl = await getQuoteTemplate();
  const customer = await prisma.customer.findUnique({ where: { id: p.customerId }, select: { commercial: true } });
  const cust = (customer?.commercial as CustomerCommercial | null) ?? null;
  const cc = effectiveCommercial(base, cust);
  const discountPct = cust?.discountPct ?? 0;

  const exWorksUnit = Math.round(((p.value * 0.86) / qty) * (1 - discountPct / 100));
  const subtotal = qty * exWorksUnit;

  await prisma.quotation.create({
    data: {
      tenantId, projectId, customerId: p.customerId, code: `CAN/Q/2026/${num}`, revision: 1, status: "draft",
      validityDays: cc.validityDays, ownerId: "U-05", product: p.productSummary,
      lineItems: [{ desc: p.productSummary, qty, unit: "no.", unitPrice: exWorksUnit }],
      packing: Math.round(subtotal * cc.packingPct / 100), freight: Math.round(subtotal * cc.freightPct / 100), insurance: Math.round(subtotal * cc.insurancePct / 100), gstPct: cc.gstPct,
      paymentTerms: cc.paymentTerms, deliveryWeeks: 20,
      scope: tpl.scope,
      exclusions: tpl.exclusions,
      terms: [
        { label: "Payment", value: cc.paymentTerms },
        { label: "Validity", value: `${cc.validityDays} days from date of offer` },
        { label: "Warranty", value: `${cc.warrantyMonths} months from commissioning` },
        ...tpl.terms.map((x) => ({ label: x.label, value: x.value })),
      ],
      blocks: ALL_BLOCKS.map((b) => ({ ...b, included: true })),
      createdAt: now, updatedAt: now,
      revisions: { create: [{ rev: 1, date: now, authorId: "U-05", change: "Offer generated from project configuration & estimate." }] },
      approvals: {
        create: [
          { role: "Sales", userId: "U-01", status: "approved", date: now },
          { role: "Engineering", userId: "U-03", status: "approved", date: now },
          { role: "Commercial", userId: "U-05", status: "pending", date: null },
          { role: "Director", userId: "U-09", status: "pending", date: null },
        ],
      },
    },
  });

  revalidatePath("/quotations");
  revalidatePath(`/projects/${projectId}`);
  return { ok: true, projectId };
}
