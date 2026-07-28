"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, MapPin, FolderKanban, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { healthTone } from "@/lib/status";
import { titleCase } from "@/lib/status";

export interface CustomerRow {
  id: string;
  name: string;
  type: string;
  city: string;
  state: string;
  rating: string;
  projectCount: number;
  orderValue: number;
  openOpps: number;
  initials: string;
}

const TYPES = ["all", "utility", "epc", "industrial", "government", "export"] as const;

export function CustomersClient({ rows }: { rows: CustomerRow[] }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (type !== "all" && r.type !== type) return false;
      return !query || r.name.toLowerCase().includes(query) || r.city.toLowerCase().includes(query);
    });
  }, [rows, q, type]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={cn("rounded-lg px-2.5 py-1 text-[12.5px] font-semibold capitalize transition-colors", type === t ? "bg-ink text-white" : "text-ink-3 hover:bg-surface-3")}>
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers…"
            className="w-56 rounded-lg border border-line bg-surface-2 py-1.5 pl-8 pr-3 text-[12.5px] text-ink outline-none placeholder:text-ink-4 focus:border-brand-line focus:bg-surface" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((r) => (
          <Link key={r.id} href={`/customers/${r.id}`}
            className="group rounded-[var(--radius-lg)] border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-pop)]">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-[13px] font-bold text-white">{r.initials}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold text-ink">{r.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-ink-3">
                  <span className="capitalize">{titleCase(r.type)}</span>
                  <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" />{r.city}</span>
                </div>
              </div>
              <Badge tone={r.rating === "A" ? healthTone["on-track"] : healthTone["at-risk"]}>{r.rating}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line-2 pt-3">
              <div><div className="tnum font-mono text-[15px] font-semibold text-ink">{r.projectCount}</div><div className="text-[10px] uppercase tracking-wide text-ink-4">Projects</div></div>
              <div><div className="tnum font-mono text-[15px] font-semibold text-ink">{money({ amount: r.orderValue, currency: "INR" })}</div><div className="text-[10px] uppercase tracking-wide text-ink-4">Order value</div></div>
              <div><div className="tnum font-mono text-[15px] font-semibold text-ink">{r.openOpps}</div><div className="text-[10px] uppercase tracking-wide text-ink-4">Open opps</div></div>
            </div>
            <div className="mt-2 flex items-center justify-end text-[12px] font-semibold text-brand opacity-0 transition-opacity group-hover:opacity-100">
              View <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
