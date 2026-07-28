"use client";

import { useMemo, useState } from "react";
import { ChevronDown, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge, Mono } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { getCompliance } from "@/lib/mock/compliance";
import { userById } from "@/lib/mock/org";
import { complianceTone, titleCase } from "@/lib/status";
import type { ComplianceStatus } from "@/lib/types";

const FILTERS: { key: "all" | ComplianceStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "comply", label: "Comply" },
  { key: "deviate", label: "Deviate" },
  { key: "note", label: "Notes" },
];

export function ComplianceClient({ projects }: { projects: { id: string; title: string }[] }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [filter, setFilter] = useState<"all" | ComplianceStatus>("all");

  const rows = useMemo(() => getCompliance(projectId), [projectId]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);
  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);
  const compliancePct = rows.length ? Math.round(((counts.comply ?? 0) / rows.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setFilter("all"); }}
            className="w-72 max-w-full appearance-none rounded-lg border border-line bg-surface py-2 pl-3 pr-9 text-[13px] font-semibold text-ink outline-none focus:border-brand-line">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="tnum text-[12px] text-ink-3"><b className="text-ink">{compliancePct}%</b> compliance</span>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={cn("rounded-lg px-2.5 py-1 text-[12.5px] font-semibold transition-colors", filter === f.key ? "bg-ink text-white" : "text-ink-3 hover:bg-surface-3")}>
              {f.label}<span className={cn("ml-1.5 tnum font-mono text-[11px]", filter === f.key ? "text-white/70" : "text-ink-4")}>{counts[f.key] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex overflow-hidden rounded-lg border border-line">
        {(["comply", "deviate", "note"] as ComplianceStatus[]).map((s) => {
          const n = counts[s] ?? 0;
          if (!n) return null;
          const tone = complianceTone[s];
          return (
            <div key={s} className={cn("flex items-center justify-center gap-1.5 py-2 text-[12px] font-semibold", tone.bg, tone.text)} style={{ flex: n }}>
              <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />{n} {titleCase(s)}
            </div>
          );
        })}
      </div>

      {/* Matrix */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
        <div className="hidden grid-cols-[52px_1fr_1fr_110px] gap-3 border-b border-line-2 px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-wide text-ink-4 lg:grid">
          <div>Clause</div><div>Tender requirement</div><div>Company specification</div><div>Status</div>
        </div>
        <div className="divide-y divide-line-2">
          {filtered.map((r) => {
            const eng = userById(r.engineerId);
            return (
              <div key={r.id} className="grid grid-cols-1 gap-2 px-4 py-3 lg:grid-cols-[52px_1fr_1fr_110px] lg:gap-3">
                <div className="tnum font-mono text-[12px] font-semibold text-ink-3">{r.clause}</div>
                <div>
                  <div className="text-[13px] font-medium text-ink">{r.requirement}</div>
                  <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-4">{r.category}</div>
                </div>
                <div>
                  <div className="text-[13px] text-ink-2">{r.companySpec}</div>
                  {r.deviation && <div className="mt-0.5 text-[11.5px] font-medium text-warn">Δ {r.deviation}</div>}
                  {r.engineerComment && (
                    <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[11.5px] text-ink-2">
                      <MessageSquareText className="mt-0.5 h-3 w-3 shrink-0 text-ink-4" />
                      <span>{r.engineerComment}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 lg:flex-col lg:items-end">
                  <Badge tone={complianceTone[r.status]} dot>{titleCase(r.status)}</Badge>
                  <div className="flex items-center gap-1 text-[10.5px] text-ink-4"><Avatar initials={eng.initials} name={eng.name} size={18} />{eng.name.split(" ")[0]}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
