import Link from "next/link";
import { ArrowLeft, Hammer } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  title,
  icon: Icon,
  phase,
  description,
}: {
  title: string;
  icon: LucideIcon;
  phase: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
          <Icon className="h-7 w-7 text-brand" strokeWidth={1.75} />
        </div>
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-brand-line bg-brand-soft px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand">
          <Hammer className="h-3 w-3" /> {phase}
        </div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-3">{description}</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-surface-3"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Overview
        </Link>
      </div>
    </div>
  );
}
