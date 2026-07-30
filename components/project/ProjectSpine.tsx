import { Check, Minus, TriangleAlert } from "lucide-react";
import type { Artifact, ProjectStage } from "@/lib/types";
import { STAGE_META, DEPARTMENT_LABEL } from "@/lib/lifecycle";
import { ArtifactCard } from "./ArtifactCard";
import { Badge } from "@/components/ui/Badge";
import { stageTone } from "@/lib/status";
import { cn } from "@/lib/cn";
import { shortDate } from "@/lib/format";

const STATE_LABEL = {
  done: "Completed", active: "In progress", pending: "Pending",
  blocked: "Blocked", skipped: "Not applicable",
} as const;

function Node({ state }: { state: ProjectStage["state"] }) {
  if (state === "done")
    return (
      <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-ok text-white ring-4 ring-ok-soft">
        <Check className="h-4 w-4" strokeWidth={3} />
      </span>
    );
  if (state === "active")
    return (
      <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-brand text-white ring-4 ring-brand-soft shadow-[var(--shadow-rail)]">
        <span className="h-2.5 w-2.5 rounded-full bg-white" />
      </span>
    );
  if (state === "blocked")
    return (
      <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-danger text-white ring-4 ring-danger-soft">
        <TriangleAlert className="h-4 w-4" strokeWidth={2.5} />
      </span>
    );
  if (state === "skipped")
    return (
      <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-dashed border-line-strong bg-surface text-ink-4">
        <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  return (
    <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-line-strong bg-surface">
      <span className="h-2 w-2 rounded-full bg-line-strong" />
    </span>
  );
}

export function ProjectSpine({
  stages,
  artifacts,
  users,
}: {
  stages: ProjectStage[];
  artifacts: Artifact[];
  users: Record<string, { name: string; initials: string }>;
}) {
  const byStage = (key: string) => artifacts.filter((a) => a.stage === key);

  return (
    <div className="relative">
      {stages.map((st, i) => {
        const meta = STAGE_META[st.key];
        const items = byStage(st.key);
        const reached = st.state === "done" || st.state === "active";
        const passed = st.state === "done";
        const expanded = items.length > 0 || st.state === "active" || st.state === "blocked";
        const isFirst = i === 0;
        const isLast = i === stages.length - 1;

        return (
          <div key={st.key} className="flex gap-4">
            {/* Rail column */}
            <div className="flex w-[30px] shrink-0 flex-col items-center">
              <div className={cn("w-0.5 flex-1", isFirst ? "opacity-0" : reached ? "bg-brand/40" : "bg-line")}
                   style={{ minHeight: 10 }} />
              <Node state={st.state} />
              <div className={cn("w-0.5 flex-1", isLast ? "opacity-0" : passed ? "bg-brand/40" : "bg-line")}
                   style={{ minHeight: expanded ? 10 : 6 }} />
            </div>

            {/* Content */}
            <div className={cn("min-w-0 flex-1", expanded ? "pb-5" : "pb-2.5", "pt-1.5")}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={cn("text-[14px] font-bold tracking-tight",
                  st.state === "pending" || st.state === "skipped" ? "text-ink-3" : "text-ink")}>
                  {meta.label}
                </h3>
                <span className="rounded bg-surface-3 px-1.5 py-px text-[10px] font-semibold text-ink-3">
                  {DEPARTMENT_LABEL[meta.department]}
                </span>
                <Badge tone={stageTone[st.state]} dot>{STATE_LABEL[st.state]}</Badge>
                {st.completedAt && <span className="text-[11px] text-ink-4">{shortDate(st.completedAt)}</span>}
                {st.startedAt && <span className="text-[11px] text-ink-4">started {shortDate(st.startedAt)}</span>}
              </div>

              {st.note && (
                <p className={cn("mt-1.5 rounded-lg px-2.5 py-1.5 text-[12px]",
                  st.state === "blocked" ? "bg-danger-soft/60 text-ink-2" : "bg-surface-2 text-ink-2")}>
                  {st.note}
                </p>
              )}

              {items.length > 0 && (
                <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                  {items.map((a) => <ArtifactCard key={a.id} artifact={a} users={users} />)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
