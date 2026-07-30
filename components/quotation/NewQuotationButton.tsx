"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, X, ChevronDown } from "lucide-react";
import { createQuotationForProject } from "@/app/actions/quotations";

export function NewQuotationButton({ projects }: { projects: { id: string; title: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");

  const generate = () => {
    if (!projectId) return;
    start(async () => {
      const res = await createQuotationForProject(projectId);
      setOpen(false);
      if (res.ok) router.push(`/quotations/${projectId}`);
      else router.refresh();
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} disabled={projects.length === 0}
        className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-rail)] transition-colors hover:bg-brand-ink disabled:opacity-40">
        <FileText className="h-4 w-4" /> New quotation
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 backdrop-blur-sm" onClick={() => !pending && setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="mt-24 w-full max-w-md rounded-[var(--radius-lg)] border border-line bg-surface shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div>
                <h2 className="text-[14px] font-bold text-ink">Generate quotation</h2>
                <p className="text-[12px] text-ink-3">Assembled from the project's configuration & estimate.</p>
              </div>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5 text-ink-4 hover:text-ink" /></button>
            </div>
            <div className="p-5">
              <label className="text-[11.5px] font-semibold text-ink-2">Project (no quotation yet)</label>
              <div className="relative mt-1">
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-line bg-surface py-2 pl-3 pr-9 text-[13px] font-medium text-ink outline-none focus:border-brand-line">
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.title}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
              <button onClick={() => setOpen(false)} className="rounded-lg border border-line bg-surface px-4 py-2 text-[13px] font-semibold text-ink-2 hover:bg-surface-3">Cancel</button>
              <button onClick={generate} disabled={pending || !projectId} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white shadow-[var(--shadow-rail)] hover:bg-brand-ink disabled:opacity-50">
                {pending ? "Generating…" : "Generate quotation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
