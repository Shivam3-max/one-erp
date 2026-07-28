import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function Stat({
  label,
  value,
  unit,
  sub,
  icon: Icon,
  delta,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  icon?: LucideIcon;
  delta?: { value: string; up: boolean };
  accent?: "brand" | "copper" | "ok" | "warn" | "danger";
}) {
  const accentColor =
    accent === "copper" ? "text-copper"
    : accent === "ok" ? "text-ok"
    : accent === "warn" ? "text-warn"
    : accent === "danger" ? "text-danger"
    : "text-brand";

  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-4">{label}</span>
        {Icon && (
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg bg-surface-3", accentColor)}>
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="tnum font-mono text-[26px] font-semibold leading-none tracking-tight text-ink">{value}</span>
        {unit && <span className="text-[13px] font-semibold text-ink-3">{unit}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2">
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold",
              delta.up ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger"
            )}
          >
            {delta.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta.value}
          </span>
        )}
        {sub && <span className="text-[11.5px] text-ink-3">{sub}</span>}
      </div>
    </div>
  );
}
