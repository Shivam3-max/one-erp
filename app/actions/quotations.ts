"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

const today = () => new Date().toISOString().slice(0, 10);

export async function setQuotationStatus(projectId: string, status: string) {
  await prisma.quotation.update({ where: { projectId }, data: { status, updatedAt: today() } });
  revalidatePath(`/quotations/${projectId}`);
  revalidatePath("/quotations");
  revalidatePath("/");
  return { ok: true, status };
}

export async function reviseQuotation(projectId: string, change: string) {
  const q = await prisma.quotation.findUnique({ where: { projectId } });
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
  await prisma.quotation.update({ where: { projectId }, data: { blocks } });
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
  const existing = await prisma.quotation.findUnique({ where: { projectId } });
  if (existing) return { ok: false, reason: "exists" };
  const p = await prisma.project.findUnique({ where: { id: projectId } });
  if (!p) return { ok: false, reason: "no-project" };

  const t = await prisma.tenant.findFirst({ select: { id: true } });
  const tenantId = t?.id ?? "T-CANDRON";
  const now = today();
  const num = projectId.split("-").pop() ?? "0000";
  const qtyMatch = p.productSummary.match(/^(\d+)\s*[×x]/);
  const qty = qtyMatch ? Number(qtyMatch[1]) : 1;
  const exWorksUnit = Math.round((p.value * 0.86) / qty);
  const subtotal = qty * exWorksUnit;

  await prisma.quotation.create({
    data: {
      tenantId, projectId, customerId: p.customerId, code: `CAN/Q/2026/${num}`, revision: 1, status: "draft",
      validityDays: 60, ownerId: "U-05", product: p.productSummary,
      lineItems: [{ desc: p.productSummary, qty, unit: "no.", unitPrice: exWorksUnit }],
      packing: Math.round(subtotal * 0.012), freight: Math.round(subtotal * 0.02), insurance: Math.round(subtotal * 0.006), gstPct: 18,
      paymentTerms: "20% advance · 70% against dispatch · 10% after commissioning", deliveryWeeks: 20,
      scope: ["Design, manufacture & routine testing", "Supply ex-works / FOR site", "Installation supervision", "Commissioning assistance", "Test certificates & O&M documentation", "Warranty support"],
      exclusions: ["Civil foundations & grouting", "HV/LV cabling & terminations", "Unloading & storage at site", "Statutory & utility approvals", "Any taxes/duties beyond those stated"],
      terms: [
        { label: "Delivery", value: "20 weeks from approved drawings & advance" },
        { label: "Payment", value: "20 / 70 / 10 (advance / dispatch / commissioning)" },
        { label: "Validity", value: "60 days from date of offer" },
        { label: "Warranty", value: "24 months from commissioning" },
        { label: "Price basis", value: "Firm, ex-works; taxes extra at actuals" },
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
