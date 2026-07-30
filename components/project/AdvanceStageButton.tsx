"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCheck } from "lucide-react";
import { advanceProjectStage } from "@/app/actions/projects";

export function AdvanceStageButton({ projectId, nextStageLabel }: { projectId: string; nextStageLabel?: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  if (!nextStageLabel) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-ok/25 bg-ok-soft px-3 py-2 text-[12.5px] font-semibold text-ok">
        <CheckCheck className="h-4 w-4" /> Lifecycle complete
      </span>
    );
  }

  return (
    <button
      onClick={() => start(async () => { await advanceProjectStage(projectId); router.refresh(); })}
      disabled={pending}
      className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white shadow-[var(--shadow-rail)] transition-colors hover:bg-brand-ink disabled:opacity-50"
    >
      {pending ? "Advancing…" : <>Advance → {nextStageLabel}</>}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}
