"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { saveConfiguration } from "@/app/actions/config";

export interface ConfigPayload {
  familyId: string;
  familyName: string;
  values: Record<string, unknown>;
  marginPct: number;
  summary: string;
}

export function SaveToProjectButton({ projects, disabled, payload }: { projects: { id: string; title: string }[]; disabled?: boolean; payload: ConfigPayload }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [saved, setSaved] = useState<string | null>(null);

  const save = () => {
    if (!projectId) return;
    start(async () => {
      await saveConfiguration({ ...payload, projectId });
      setSaved(projectId);
      setOpen(false);
      router.refresh();
    });
  };

  if (saved) {
    return (
      <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ok/30 bg-ok-soft px-3 py-2.5 text-[13px] font-semibold text-ok">
        <Check className="h-4 w-4" /> Saved to {saved}
        <button onClick={() => setSaved(null)} className="ml-1 text-[11px] font-medium text-ink-4 underline">save again</button>
      </div>
    );
  }

  if (open) {
    return (
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
            className="w-full appearance-none rounded-lg border border-line bg-surface py-2.5 pl-3 pr-8 text-[12.5px] font-medium text-ink outline-none focus:border-brand-line">
            {projects.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.title}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
        </div>
        <button onClick={save} disabled={pending}
          className="rounded-lg bg-brand px-3 py-2.5 text-[13px] font-semibold text-white shadow-[var(--shadow-rail)] hover:bg-brand-ink disabled:opacity-50">
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setOpen(true)} disabled={disabled}
      className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2.5 text-[13px] font-semibold text-white shadow-[var(--shadow-rail)] transition-colors hover:bg-brand-ink disabled:cursor-not-allowed disabled:opacity-40")}>
      <Save className="h-4 w-4" /> Save to project
    </button>
  );
}
