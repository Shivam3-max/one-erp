"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, GitBranch, Download, FileText } from "lucide-react";
import { cn } from "@/lib/cn";
import { Mono } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { relDate } from "@/lib/format";
import { FORMAT_TONE, type DocCategory } from "@/lib/documents";

export interface DocRow {
  id: string;
  title: string;
  category: DocCategory;
  format: string;
  size: string;
  projectId: string;
  projectTitle: string;
  status: string;
  revision: number;
  ownerName: string;
  ownerInitials: string;
  updatedAt: string;
}

export function DocumentsClient({
  rows,
  categories,
  projects,
}: {
  rows: DocRow[];
  categories: { name: DocCategory; count: number }[];
  projects: { id: string; title: string }[];
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"all" | DocCategory>("all");
  const [project, setProject] = useState("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (cat !== "all" && r.category !== cat) return false;
      if (project !== "all" && r.projectId !== project) return false;
      if (!query) return true;
      return r.title.toLowerCase().includes(query) || r.id.toLowerCase().includes(query) || r.projectTitle.toLowerCase().includes(query);
    });
  }, [rows, q, cat, project]);

  const totalRevisions = rows.reduce((s, r) => s + r.revision, 0);

  return (
    <div className="space-y-4">
      {/* stat chips */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Chip label="Documents" value={String(rows.length)} />
        <Chip label="Projects" value={String(projects.length)} />
        <Chip label="Revisions tracked" value={String(totalRevisions)} />
        <Chip label="Categories" value={String(categories.length)} />
      </div>

      {/* category filters */}
      <div className="flex flex-wrap gap-1.5">
        <FilterPill active={cat === "all"} onClick={() => setCat("all")} label="All" count={rows.length} />
        {categories.map((c) => (
          <FilterPill key={c.name} active={cat === c.name} onClick={() => setCat(c.name)} label={c.name} count={c.count} />
        ))}
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <select value={project} onChange={(e) => setProject(e.target.value)}
            className="w-64 max-w-full appearance-none rounded-lg border border-line bg-surface py-2 pl-3 pr-9 text-[12.5px] font-medium text-ink outline-none focus:border-brand-line">
            <option value="all">All projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents…"
            className="w-56 rounded-lg border border-line bg-surface-2 py-1.5 pl-8 pr-3 text-[12.5px] text-ink outline-none placeholder:text-ink-4 focus:border-brand-line focus:bg-surface" />
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-card)]">
        <div className="hidden grid-cols-[1fr_200px_90px_130px] gap-3 border-b border-line-2 px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-wide text-ink-4 lg:grid">
          <div>Document</div><div>Project</div><div>Version</div><div className="text-right">Owner · Updated</div>
        </div>
        <div className="divide-y divide-line-2">
          {filtered.map((r) => (
            <div key={r.id} className="grid grid-cols-1 gap-2 px-4 py-3 transition-colors hover:bg-surface-2 lg:grid-cols-[1fr_200px_90px_130px] lg:items-center">
              <div className="flex items-center gap-3 min-w-0">
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-[9.5px] font-bold", FORMAT_TONE[r.format] ?? "bg-surface-3 text-ink-3")}>
                  {r.format}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Mono className="font-semibold text-brand">{r.id}</Mono>
                    <span className="rounded bg-surface-3 px-1.5 py-px text-[10px] font-semibold text-ink-4">{r.category}</span>
                  </div>
                  <div className="truncate text-[13px] font-medium text-ink">{r.title}</div>
                </div>
              </div>
              <Link href={`/projects/${r.projectId}`} className="truncate text-[12px] font-medium text-ink-2 hover:text-brand">{r.projectTitle}</Link>
              <div className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
                <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-3">R{r.revision}</span>
                {r.revision > 1 && <span className="inline-flex items-center gap-0.5 text-ink-4"><GitBranch className="h-3 w-3" />{r.revision}</span>}
              </div>
              <div className="flex items-center justify-between gap-2 lg:justify-end">
                <div className="flex items-center gap-1.5 text-[11px] text-ink-4">
                  <Avatar initials={r.ownerInitials} name={r.ownerName} size={22} />
                  <span className="hidden sm:inline">{relDate(r.updatedAt)}</span>
                </div>
                <span className="text-[10.5px] text-ink-4">{r.size}</span>
                <button className="text-ink-4 hover:text-brand"><Download className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-12 text-center text-[13px] text-ink-4">No documents match your filter.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-3 shadow-[var(--shadow-card)]">
      <div className="tnum font-mono text-[22px] font-semibold text-ink">{value}</div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-4">{label}</div>
    </div>
  );
}
function FilterPill({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button onClick={onClick} className={cn("rounded-lg px-2.5 py-1 text-[12px] font-semibold transition-colors", active ? "bg-ink text-white" : "bg-surface text-ink-3 hover:bg-surface-3 border border-line")}>
      {label}<span className={cn("ml-1.5 tnum font-mono text-[10.5px]", active ? "text-white/60" : "text-ink-4")}>{count}</span>
    </button>
  );
}
