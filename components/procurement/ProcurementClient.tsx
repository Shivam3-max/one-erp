"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, GitBranch, ShoppingCart, TruckIcon, TriangleAlert, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { money, shortDate } from "@/lib/format";
import { Badge, Mono } from "@/components/ui/Badge";
import { REQ_STATUS_ORDER, REQ_STATUS_LABEL, type ReqStatus, type MaterialReq, type Vendor } from "@/lib/mock/procurement";
import { healthTone } from "@/lib/status";
import { advanceRequirement, raiseRFQ, awardPO } from "@/app/actions/execution";

const NEXT_LABEL: Record<ReqStatus, string> = { required: "Raise RFQ", rfq: "Place PO", po: "Mark received", received: "" };

const inr = (n: number) => money({ amount: n, currency: "INR" });

const STATUS_TONE: Record<ReqStatus, { bg: string; text: string; dot: string }> = {
  required: { bg: "bg-neutral-soft", text: "text-ink-3", dot: "bg-ink-4" },
  rfq: { bg: "bg-warn-soft", text: "text-warn", dot: "bg-warn" },
  po: { bg: "bg-brand-soft", text: "text-brand", dot: "bg-brand" },
  received: { bg: "bg-ok-soft", text: "text-ok", dot: "bg-ok" },
};

export function ProcurementClient({ projects, reqsByProject, vendors }: { projects: { id: string; title: string }[]; reqsByProject: Record<string, MaterialReq[]>; vendors: Vendor[] }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const router = useRouter();
  const [pending, start] = useTransition();
  const advance = (id: string) => start(async () => { await advanceRequirement(id); router.refresh(); });
  const rfq = (id: string) => start(async () => { await raiseRFQ(id); router.refresh(); });
  const award = (id: string, vendorId: string) => start(async () => { await awardPO(id, vendorId); router.refresh(); });
  const vendorById = (id: string) => vendors.find((v) => v.id === id);
  const reqs = useMemo(() => reqsByProject[projectId] ?? [], [reqsByProject, projectId]);

  const committed = reqs.filter((r) => r.status === "po" || r.status === "received").reduce((s, r) => s + r.value, 0);
  const open = reqs.filter((r) => r.status !== "received").length;
  const atRisk = reqs.filter((r) => r.status === "required" || r.status === "rfq").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
            className="w-72 max-w-full appearance-none rounded-lg border border-line bg-surface py-2 pl-3 pr-9 text-[13px] font-semibold text-ink outline-none focus:border-brand-line">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-brand-line bg-brand-soft px-3 py-1.5 text-[12px] font-medium text-brand-ink">
          <GitBranch className="h-3.5 w-3.5" /> Generated from the Engineering BOM
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniKPI icon={ShoppingCart} label="Committed value" value={inr(committed)} tone="brand" />
        <MiniKPI icon={TruckIcon} label="Open lines" value={String(open)} tone="warn" />
        <MiniKPI icon={TriangleAlert} label="Not yet ordered" value={String(atRisk)} tone={atRisk ? "danger" : "ok"} />
        <MiniKPI icon={CheckCircle2} label="Received" value={String(reqs.filter((r) => r.status === "received").length)} tone="ok" />
      </div>

      {/* Requirements table */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
        <div className="hidden grid-cols-[1fr_150px_120px_140px_110px] gap-3 border-b border-line-2 px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-wide text-ink-4 lg:grid">
          <div>Material requirement</div><div>Vendor</div><div>Required by</div><div>Status</div><div className="text-right">Value</div>
        </div>
        <div className="divide-y divide-line-2">
          {reqs.map((r) => {
            const vendor = vendorById(r.vendorId);
            const tone = STATUS_TONE[r.status];
            const hasQuotes = r.status === "rfq" && (r.quotes?.length ?? 0) > 0;
            const bestPrice = hasQuotes ? Math.min(...r.quotes!.map((q) => q.price)) : 0;
            return (
              <div key={r.id}>
                <div className="grid grid-cols-1 gap-2 px-4 py-3 lg:grid-cols-[1fr_150px_120px_140px_110px] lg:items-center">
                  <div>
                    <div className="text-[13px] font-semibold text-ink">{r.item}</div>
                    <div className="tnum font-mono text-[11px] text-ink-3">{r.qty.toLocaleString("en-IN")} {r.unit} · {r.category}{r.poNo && <> · <span className="text-brand">{r.poNo}</span></>}</div>
                  </div>
                  <div className="text-[12px] text-ink-2">{vendor?.name}</div>
                  <div className="text-[12px] text-ink-3">{shortDate(r.requiredBy)}</div>
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", tone.bg, tone.text)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />{REQ_STATUS_LABEL[r.status]}
                    </span>
                    {r.status === "required" && (
                      <button onClick={() => rfq(r.id)} disabled={pending}
                        className="inline-flex items-center gap-0.5 rounded-md border border-line px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-3 transition-colors hover:border-brand-line hover:bg-brand-soft hover:text-brand disabled:opacity-40">
                        Raise RFQ <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                    {(r.status === "po") && (
                      <button onClick={() => advance(r.id)} disabled={pending}
                        className="inline-flex items-center gap-0.5 rounded-md border border-line px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-3 transition-colors hover:border-brand-line hover:bg-brand-soft hover:text-brand disabled:opacity-40">
                        Mark received <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-left tnum font-mono text-[13px] font-semibold text-ink lg:text-right">{inr(r.value)}</div>
                </div>

                {hasQuotes && (
                  <div className="mx-4 mb-3 rounded-lg border border-line-2 bg-surface-2/60 p-3">
                    <div className="mb-2 text-[10.5px] font-bold uppercase tracking-wide text-ink-4">Vendor RFQ comparison — award to proceed</div>
                    <div className="space-y-1.5">
                      {[...r.quotes!].sort((a, b) => a.price - b.price).map((q) => {
                        const best = q.price === bestPrice;
                        return (
                          <div key={q.vendorId} className={cn("flex items-center gap-3 rounded-md px-2.5 py-1.5", best ? "bg-ok-soft/60" : "bg-surface")}>
                            <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink">{q.vendorName}{best && <span className="ml-1.5 rounded bg-ok px-1 py-px text-[9px] font-bold uppercase text-white">lowest</span>}</span>
                            <span className="tnum shrink-0 font-mono text-[11px] text-ink-3">{q.leadWeeks}w lead</span>
                            <span className="tnum w-20 shrink-0 text-right font-mono text-[12.5px] font-semibold text-ink">{inr(q.price)}</span>
                            <button onClick={() => award(r.id, q.vendorId)} disabled={pending}
                              className="shrink-0 rounded-md bg-brand px-2 py-0.5 text-[10.5px] font-semibold text-white hover:bg-brand-ink disabled:opacity-40">Award</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* progress footer */}
        <div className="border-t border-line-2 px-4 py-2.5">
          <div className="flex gap-0.5">
            {REQ_STATUS_ORDER.map((s) => {
              const n = reqs.filter((r) => r.status === s).length;
              if (!n) return null;
              return <div key={s} className={cn("h-2 rounded-sm", STATUS_TONE[s].dot)} style={{ flex: n }} title={`${REQ_STATUS_LABEL[s]}: ${n}`} />;
            })}
          </div>
        </div>
      </div>

      {/* Vendors */}
      <div className="rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
        <div className="border-b border-line-2 px-4 py-3 text-[13px] font-bold text-ink">Approved vendors</div>
        <div className="grid grid-cols-1 divide-y divide-line-2 sm:grid-cols-2 sm:divide-x lg:grid-cols-3">
          {vendors.map((v) => (
            <div key={v.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-[12.5px] font-semibold text-ink">{v.name}</div>
                <div className="text-[11px] text-ink-3">{v.category} · {v.location}</div>
              </div>
              <div className="text-right">
                <Badge tone={v.rating === "A" ? healthTone["on-track"] : healthTone["at-risk"]}>{v.rating}</Badge>
                <div className="mt-0.5 tnum font-mono text-[10.5px] text-ink-4">{v.onTimePct}% on-time</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniKPI({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: "brand" | "warn" | "danger" | "ok" }) {
  const color = tone === "warn" ? "text-warn" : tone === "danger" ? "text-danger" : tone === "ok" ? "text-ok" : "text-brand";
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-3.5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">{label}</span>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div className="mt-2 tnum font-mono text-[20px] font-semibold text-ink">{value}</div>
    </div>
  );
}
