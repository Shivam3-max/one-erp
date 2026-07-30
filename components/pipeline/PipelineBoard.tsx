"use client";

import Link from "next/link";
import { TrendingUp, Wallet, Target, Trophy, CalendarClock } from "lucide-react";
import { cn } from "@/lib/cn";
import { money, shortDate } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Mono } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Stat";
import { STAGE_ORDER, STAGE_LABEL, STAGE_PROB, type OppStage } from "@/lib/mock/pipeline";

type Opp = { id: string; title: string; customerId: string; stage: OppStage; value: number; ownerId: string; expectedClose: string; source: string; projectId?: string; lastActivity: string };
type Lite = { name: string; initials: string };

const inr = (n: number) => money({ amount: n, currency: "INR" });

const COL_ACCENT: Record<OppStage, string> = {
  new: "bg-ink-4", qualified: "bg-brand-2", proposal: "bg-brand", negotiation: "bg-warn", won: "bg-ok", lost: "bg-danger",
};

export function PipelineBoard({ opportunities, customerMap, userMap }: { opportunities: Opp[]; customerMap: Record<string, { name: string }>; userMap: Record<string, Lite> }) {
  const open = opportunities.filter((o) => o.stage !== "won" && o.stage !== "lost");
  const pipelineValue = open.reduce((s, o) => s + o.value, 0);
  const weighted = open.reduce((s, o) => s + o.value * STAGE_PROB[o.stage], 0);
  const won = opportunities.filter((o) => o.stage === "won");
  const lost = opportunities.filter((o) => o.stage === "lost");
  const winRate = won.length + lost.length ? won.length / (won.length + lost.length) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open Pipeline" value={inr(pipelineValue)} icon={Wallet} accent="brand" sub={`${open.length} opportunities`} />
        <Stat label="Weighted Forecast" value={inr(weighted)} icon={Target} accent="copper" sub="probability-adjusted" />
        <Stat label="Win Rate" value={(winRate * 100).toFixed(0)} unit="%" icon={Trophy} accent="ok" sub={`${won.length}W · ${lost.length}L`} />
        <Stat label="Won (value)" value={inr(won.reduce((s, o) => s + o.value, 0))} icon={TrendingUp} sub="this year" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {STAGE_ORDER.map((stage) => {
          const items = opportunities.filter((o) => o.stage === stage);
          const colValue = items.reduce((s, o) => s + o.value, 0);
          return (
            <div key={stage} className="flex flex-col rounded-[var(--radius-lg)] border border-line bg-surface-2/60">
              <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", COL_ACCENT[stage])} />
                  <span className="text-[12.5px] font-bold text-ink">{STAGE_LABEL[stage]}</span>
                  <span className="tnum rounded-full bg-surface-3 px-1.5 text-[10.5px] font-semibold text-ink-4">{items.length}</span>
                </div>
                <span className="tnum font-mono text-[10.5px] text-ink-4">{inr(colValue)}</span>
              </div>
              <div className="flex-1 space-y-2 p-2">
                {items.map((o) => {
                  const cust = customerMap[o.customerId];
                  const owner = userMap[o.ownerId];
                  const card = (
                    <div className="rounded-xl border border-line bg-surface p-2.5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-pop)]">
                      <div className="flex items-center justify-between">
                        <Mono className="text-[10.5px] font-semibold text-brand">{o.id}</Mono>
                        <span className="tnum font-mono text-[12px] font-bold text-ink">{inr(o.value)}</span>
                      </div>
                      <div className="mt-1 text-[12px] font-semibold leading-tight text-ink">{o.title}</div>
                      <div className="mt-0.5 text-[11px] text-ink-3">{cust.name.split(" ").slice(0, 2).join(" ")} · {o.source}</div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[10.5px] text-ink-4"><CalendarClock className="h-3 w-3" />{shortDate(o.expectedClose)}</span>
                        <Avatar initials={owner.initials} name={owner.name} size={20} />
                      </div>
                    </div>
                  );
                  return o.projectId ? <Link key={o.id} href={`/projects/${o.projectId}`}>{card}</Link> : <div key={o.id}>{card}</div>;
                })}
                {items.length === 0 && <div className="py-6 text-center text-[11px] text-ink-4">No opportunities</div>}
              </div>
            </div>
          );
        })}
      </div>
      {lost.length > 0 && (
        <div className="text-[11.5px] text-ink-4">
          Lost: {lost.map((o) => <span key={o.id} className="mr-2">{o.title} ({inr(o.value)})</span>)}
        </div>
      )}
    </div>
  );
}
