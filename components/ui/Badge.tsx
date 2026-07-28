import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/status";

export function Badge({
  tone,
  children,
  dot = false,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        tone.bg,
        tone.text,
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />}
      {children}
    </span>
  );
}

/** A small keyed reference — project IDs, artifact IDs, serial numbers. */
export function Mono({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("font-mono text-[12px] tracking-tight text-ink-2", className)}>
      {children}
    </span>
  );
}
