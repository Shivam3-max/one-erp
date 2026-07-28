import type {
  StageState,
  ProjectHealth,
  ArtifactStatus,
  ComplianceStatus,
  ProjectPriority,
} from "./types";

export interface Tone {
  text: string;
  bg: string;
  dot: string;
  border: string;
}

const TONES = {
  ok: { text: "text-ok", bg: "bg-ok-soft", dot: "bg-ok", border: "border-ok/25" },
  brand: { text: "text-brand", bg: "bg-brand-soft", dot: "bg-brand", border: "border-brand-line" },
  warn: { text: "text-warn", bg: "bg-warn-soft", dot: "bg-warn", border: "border-warn/25" },
  danger: { text: "text-danger", bg: "bg-danger-soft", dot: "bg-danger", border: "border-danger/25" },
  neutral: { text: "text-ink-3", bg: "bg-neutral-soft", dot: "bg-ink-4", border: "border-line-strong" },
  copper: { text: "text-copper", bg: "bg-copper-soft", dot: "bg-copper", border: "border-copper/25" },
} as const;

export const stageTone: Record<StageState, Tone> = {
  done: TONES.ok,
  active: TONES.brand,
  pending: TONES.neutral,
  blocked: TONES.danger,
  skipped: TONES.neutral,
};

export const healthTone: Record<ProjectHealth, Tone> = {
  "on-track": TONES.ok,
  "at-risk": TONES.warn,
  critical: TONES.danger,
  closed: TONES.neutral,
};

export const healthLabel: Record<ProjectHealth, string> = {
  "on-track": "On track",
  "at-risk": "At risk",
  critical: "Critical",
  closed: "Closed",
};

export const priorityTone: Record<ProjectPriority, Tone> = {
  low: TONES.neutral,
  medium: TONES.brand,
  high: TONES.warn,
  critical: TONES.danger,
};

export const artifactStatusTone: Record<ArtifactStatus, Tone> = {
  draft: TONES.neutral,
  "in-review": TONES.warn,
  approved: TONES.ok,
  issued: TONES.brand,
  superseded: TONES.neutral,
  rejected: TONES.danger,
};

export const complianceTone: Record<ComplianceStatus, Tone> = {
  comply: TONES.ok,
  deviate: TONES.warn,
  note: TONES.brand,
  "not-applicable": TONES.neutral,
};

export function titleCase(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
