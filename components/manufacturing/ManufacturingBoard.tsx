"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Factory, Pause, Play, CheckCircle2, Gauge, TriangleAlert, Cog, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { shortDate, initialsOf } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Mono } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import { PROD_STAGES, type WOStatus, type WorkOrder } from "@/lib/mock/manufacturing";
import { advanceWorkOrder, toggleWorkOrderHold } from "@/app/actions/execution";

const STATUS: Record<WOStatus, { label: string; bar: string; chip: string }> = {
  queued: { label: "Queued", bar: "bg-ink-4", chip: "bg-neutral-soft text-ink-3" },
  "in-progress": { label: "In progress", bar: "bg-brand", chip: "bg-brand-soft text-brand" },
  hold: { label: "On hold", bar: "bg-danger", chip: "bg-danger-soft text-danger" },
  done: { label: "Done", bar: "bg-ok", chip: "bg-ok-soft text-ok" },
};

export function ManufacturingBoard({ workOrders }: { workOrders: WorkOrder[] }) {
  const inProd = workOrders.filter((w) => w.status === "in-progress").length;
  const onHold = workOrders.filter((w) => w.status === "hold").length;
  const done = workOrders.filter((w) => w.status === "done").length;
  const avg = workOrders.length ? Math.round(workOrders.reduce((s, w) => s + w.progress, 0) / workOrders.length) : 0;

  const router = useRouter();
  const [pending, start] = useTransition();
  const advance = (id: string) => start(async () => { await advanceWorkOrder(id); router.refresh(); });
  const toggleHold = (id: string) => start(async () => { await toggleWorkOrderHold(id); router.refresh(); });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="In Production" value={String(inProd)} icon={Factory} accent="brand" sub="active work orders" />
        <Stat label="On Hold" value={String(onHold)} icon={Pause} accent={onHold ? "danger" : "ok"} sub={onHold ? "needs attention" : "clear"} />
        <Stat label="Completed Stages" value={String(done)} icon={CheckCircle2} accent="ok" />
        <Stat label="Avg Progress" value={String(avg)} unit="%" icon={Gauge} accent="copper" />
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-3">
          {PROD_STAGES.map((stage) => {
            const items = workOrders.filter((w) => w.stage === stage.key);
            return (
              <div key={stage.key} className="flex w-[220px] shrink-0 flex-col rounded-[var(--radius-lg)] border border-line bg-surface-2/60">
                <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
                  <Cog className="h-3.5 w-3.5 text-ink-4" />
                  <span className="text-[12px] font-bold text-ink">{stage.label}</span>
                  <span className="tnum ml-auto rounded-full bg-surface-3 px-1.5 text-[10.5px] font-semibold text-ink-4">{items.length}</span>
                </div>
                <div className="flex-1 space-y-2 p-2">
                  {items.map((w) => {
                    const st = STATUS[w.status];
                    return (
                      <div key={w.id} className="rounded-xl border border-line bg-surface p-2.5 shadow-[var(--shadow-card)]">
                        <div className="flex items-center justify-between">
                          <Link href={`/projects/${w.projectId}`} className="hover:underline"><Mono className="text-[10px] font-semibold text-brand">{w.id}</Mono></Link>
                          <span className={cn("rounded-full px-1.5 py-0.5 text-[9.5px] font-bold", st.chip)}>{st.label}</span>
                        </div>
                        <div className="mt-1 text-[12px] font-semibold leading-tight text-ink">{w.unit}</div>
                        <div className="text-[10.5px] text-ink-3">{w.projectShort} · {w.machine}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                            <div className={cn("h-full rounded-full", st.bar)} style={{ width: `${w.progress}%` }} />
                          </div>
                          <span className="tnum font-mono text-[9.5px] text-ink-4">{w.progress}%</span>
                        </div>
                        {w.issue && (
                          <div className="mt-1.5 flex items-start gap-1 text-[10px] text-danger">
                            <TriangleAlert className="mt-0.5 h-2.5 w-2.5 shrink-0" />{w.issue}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-ink-4">
                          <Avatar initials={initialsOf(w.operator)} name={w.operator} size={16} />
                          <span className="truncate">{w.operator}</span>
                        </div>
                        <div className="mt-2 flex gap-1.5 border-t border-line-2 pt-2">
                          <button onClick={() => advance(w.id)} disabled={pending || w.status === "done"}
                            className="flex flex-1 items-center justify-center gap-0.5 rounded-md bg-brand px-2 py-1 text-[10.5px] font-semibold text-white transition-colors hover:bg-brand-ink disabled:opacity-40">
                            {w.status === "done" ? "Complete" : <>+25% <ChevronsRight className="h-3 w-3" /></>}
                          </button>
                          <button onClick={() => toggleHold(w.id)} disabled={pending || w.status === "done"} title={w.status === "hold" ? "Resume" : "Hold"}
                            className="flex items-center justify-center rounded-md border border-line px-2 py-1 text-ink-3 transition-colors hover:bg-surface-3 disabled:opacity-40">
                            {w.status === "hold" ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {items.length === 0 && <div className="py-5 text-center text-[10.5px] text-ink-4">—</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
