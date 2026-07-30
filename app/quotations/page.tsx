import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, Mono } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { getQuotations, getCustomerMap, getUserMap, getProjects } from "@/lib/data";
import { quoteTotals } from "@/lib/mock/quotations";
import { money } from "@/lib/format";
import { healthTone } from "@/lib/status";
import { stageIndex } from "@/lib/lifecycle";
import { NewQuotationButton } from "@/components/quotation/NewQuotationButton";

const statusTone = {
  draft: healthTone.closed, issued: healthTone["on-track"], won: healthTone["on-track"],
  lost: healthTone.critical, revised: healthTone["at-risk"],
} as const;

export default async function QuotationsPage() {
  const [quotations, customerMap, userMap, projects] = await Promise.all([getQuotations(), getCustomerMap(), getUserMap(), getProjects()]);
  const projMap = Object.fromEntries(projects.map((p) => [p.id, p]));
  const quoted = new Set(quotations.map((q) => q.projectId));
  const quotable = projects
    .filter((p) => !quoted.has(p.id) && stageIndex(p.currentStage) >= stageIndex("estimation"))
    .map((p) => ({ id: p.id, title: p.title }));

  return (
    <>
      <PageHeader
        eyebrow="Engineering"
        title="Quotations"
        subtitle="A document-assembly system — commercial, technical, compliance and terms, composed from structured project data."
        action={<NewQuotationButton projects={quotable} />}
      />
      <div className="rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
        <div className="hidden grid-cols-[1fr_170px_90px_130px_120px] gap-3 border-b border-line-2 px-5 py-2.5 text-[10.5px] font-bold uppercase tracking-wide text-ink-4 lg:grid">
          <div>Quotation</div><div>Customer</div><div>Revision</div><div className="text-right">Value</div><div className="text-right">Status</div>
        </div>
        <div className="divide-y divide-line-2">
          {quotations.map((q) => {
            const project = projMap[q.projectId];
            const cust = customerMap[q.customerId];
            const owner = userMap[q.ownerId];
            const { grandTotal } = quoteTotals(q as never);
            return (
              <Link key={q.id} href={`/quotations/${q.projectId}`}
                className="grid grid-cols-1 gap-2 px-5 py-3.5 transition-colors hover:bg-surface-2 lg:grid-cols-[1fr_170px_90px_130px_120px] lg:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand"><FileText className="h-3.5 w-3.5" /></span>
                    <Mono className="font-semibold text-brand">{q.id}</Mono>
                  </div>
                  <div className="mt-0.5 truncate text-[13px] font-semibold text-ink">{project?.title}</div>
                  <div className="truncate text-[11.5px] text-ink-3">{q.product}</div>
                </div>
                <div className="truncate text-[12.5px] text-ink-2">{cust?.name.split(" ").slice(0, 2).join(" ")}</div>
                <div><span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-3">R{q.revision}</span></div>
                <div className="text-left tnum font-mono text-[13px] font-semibold text-ink lg:text-right">{money({ amount: grandTotal, currency: "INR" })}</div>
                <div className="flex items-center justify-between gap-2 lg:justify-end">
                  <Badge tone={statusTone[q.status as keyof typeof statusTone]} dot>{q.status.toUpperCase()}</Badge>
                  <Avatar initials={owner?.initials ?? "?"} name={owner?.name} size={24} />
                  <ChevronRight className="hidden h-4 w-4 text-ink-4 lg:block" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
