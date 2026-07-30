import { notFound } from "next/navigation";
import { QuotationDoc, type QuoteVM } from "@/components/quotation/QuotationDoc";
import { quoteTotals } from "@/lib/mock/quotations";
import { getQuotationByProject, getComplianceItems, getProject, getCustomer, getUserMap } from "@/lib/data";

export default async function QuotationDetail({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [q, project, compItems, userMap] = await Promise.all([
    getQuotationByProject(projectId), getProject(projectId), getComplianceItems(projectId), getUserMap(),
  ]);
  if (!q || !project) notFound();

  const customer = (await getCustomer(q.customerId))!;
  const owner = userMap[q.ownerId];
  const totals = quoteTotals(q as never);

  const counts = { comply: 0, deviate: 0, note: 0 } as Record<string, number>;
  for (const c of compItems) counts[c.status] = (counts[c.status] ?? 0) + 1;
  const flagged = compItems
    .filter((c) => c.status !== "comply")
    .map((c) => ({ clause: c.clause, requirement: c.requirement, companySpec: c.companySpec, status: c.status, deviation: c.deviation }));

  const vm: QuoteVM = {
    id: q.id,
    projectId: q.projectId,
    projectTitle: project.title,
    revision: q.revision,
    status: q.status,
    validityDays: q.validityDays,
    updatedAt: q.updatedAt,
    customerName: customer.name,
    customerCity: `${customer.city}, ${customer.state}`,
    ownerName: owner.name,
    ownerInitials: owner.initials,
    product: q.product,
    standards: "IS 2026 / IEC 60076",
    lineItems: q.lineItems.map((l) => ({ ...l, amount: l.qty * l.unitPrice })),
    packing: q.packing, freight: q.freight, insurance: q.insurance, gstPct: q.gstPct,
    subtotal: totals.subtotal, taxable: totals.taxable, gst: totals.gst, grandTotal: totals.grandTotal,
    paymentTerms: q.paymentTerms, deliveryWeeks: q.deliveryWeeks,
    scope: q.scope, exclusions: q.exclusions, terms: q.terms,
    blocks: q.blocks,
    revisions: q.revisions.map((r) => ({ rev: r.rev, date: r.date, authorName: userMap[r.authorId]?.name ?? "—", change: r.change })),
    approvals: q.approvals.map((a) => {
      const u = userMap[a.userId];
      return { role: a.role, userName: u?.name ?? "—", userInitials: u?.initials ?? "?", status: a.status, date: a.date };
    }),
    compliance: {
      total: compItems.length,
      comply: counts.comply ?? 0,
      deviate: counts.deviate ?? 0,
      note: counts.note ?? 0,
      flagged,
    },
  };

  return <QuotationDoc vm={vm} />;
}
