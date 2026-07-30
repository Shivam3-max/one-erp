"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, ChevronRight } from "lucide-react";
import { Badge, Mono } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { money, shortDate } from "@/lib/format";
import { healthTone, healthLabel } from "@/lib/status";
import type { ProjectHealth } from "@/lib/types";

export interface ProjectRow {
  id: string;
  title: string;
  customer: string;
  location: string;
  product: string;
  tags: string[];
  stageLabel: string;
  stageIdx: number;
  stageTotal: number;
  value: number;
  margin?: number;
  health: ProjectHealth;
  ownerName: string;
  ownerInitials: string;
  target?: string;
}

const FILTERS: { key: "all" | ProjectHealth; label: string }[] = [
  { key: "all", label: "All" },
  { key: "on-track", label: "On track" },
  { key: "at-risk", label: "At risk" },
  { key: "critical", label: "Critical" },
  { key: "closed", label: "Closed" },
];

export function ProjectsTable({ rows }: { rows: ProjectRow[] }) {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [filter, setFilter] = useState<"all" | ProjectHealth>("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.health] = (c[r.health] ?? 0) + 1;
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.health !== filter) return false;
      if (!query) return true;
      return (
        r.title.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query) ||
        r.customer.toLowerCase().includes(query) ||
        r.product.toLowerCase().includes(query)
      );
    });
  }, [rows, q, filter]);

  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex flex-wrap items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[12.5px] font-semibold transition-colors",
                filter === f.key ? "bg-ink text-white" : "text-ink-3 hover:bg-surface-3"
              )}
            >
              {f.label}
              <span className={cn("ml-1.5 tnum font-mono text-[11px]", filter === f.key ? "text-white/70" : "text-ink-4")}>
                {counts[f.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter projects…"
            className="w-52 rounded-lg border border-line bg-surface-2 py-1.5 pl-8 pr-3 text-[12.5px] text-ink outline-none placeholder:text-ink-4 focus:border-brand-line focus:bg-surface"
          />
        </div>
      </div>

      {/* Header */}
      <div className="hidden grid-cols-[1fr_150px_180px_110px_120px] gap-3 border-b border-line-2 px-5 py-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-4 lg:grid">
        <div>Project</div>
        <div>Customer</div>
        <div>Lifecycle stage</div>
        <div className="text-right">Value</div>
        <div className="text-right">Health · Owner</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-line-2">
        {filtered.map((r) => (
          <Link
            key={r.id}
            href={`/projects/${r.id}`}
            className="grid grid-cols-1 gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2 lg:grid-cols-[1fr_150px_180px_110px_120px] lg:items-center"
          >
            {/* Project */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Mono className="font-semibold text-brand">{r.id}</Mono>
                {r.tags[0] && (
                  <span className="rounded bg-surface-3 px-1.5 py-px text-[10px] font-semibold text-ink-3">{r.tags[0]}</span>
                )}
              </div>
              <div className="mt-0.5 truncate text-[13.5px] font-semibold text-ink">{r.title}</div>
              <div className="truncate text-[11.5px] text-ink-3">{r.product}</div>
            </div>

            {/* Customer */}
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-medium text-ink-2">{r.customer.split(" ").slice(0, 2).join(" ")}</div>
              <div className="truncate text-[11px] text-ink-4">{r.location}</div>
            </div>

            {/* Lifecycle */}
            <div>
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="font-semibold text-ink-2">{r.stageLabel}</span>
                <span className="tnum font-mono text-[10.5px] text-ink-4">{r.stageIdx + 1}/{r.stageTotal}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2"
                  style={{ width: `${((r.stageIdx + 1) / r.stageTotal) * 100}%` }} />
              </div>
            </div>

            {/* Value */}
            <div className="text-left lg:text-right">
              <div className="tnum font-mono text-[13px] font-semibold text-ink">{money({ amount: r.value, currency: "INR" })}</div>
              {r.margin != null && <div className="text-[11px] text-ink-4">{r.margin.toFixed(1)}% margin</div>}
            </div>

            {/* Health + owner */}
            <div className="flex items-center justify-between gap-2 lg:justify-end">
              <Badge tone={healthTone[r.health]} dot>{healthLabel[r.health]}</Badge>
              <div className="flex items-center gap-1.5">
                <Avatar initials={r.ownerInitials} name={r.ownerName} size={24} />
                <ChevronRight className="hidden h-4 w-4 text-ink-4 lg:block" />
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-[13px] text-ink-4">No projects match your filter.</div>
        )}
      </div>
    </div>
  );
}
