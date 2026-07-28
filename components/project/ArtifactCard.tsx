import {
  FileStack, FileQuestion, ListChecks, ClipboardCheck, DraftingCompass,
  SlidersHorizontal, Layers, Calculator, FileText, FileCheck2, Package,
  Wrench, BadgeCheck, ClipboardList, Truck, PlugZap, ShieldCheck, Receipt,
  Mail, NotebookPen, Image as ImageIcon, GitBranch, ArrowUpRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Artifact, ArtifactType } from "@/lib/types";
import { Badge, Mono } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { artifactStatusTone, healthTone, titleCase } from "@/lib/status";
import { relDate } from "@/lib/format";
import { userById } from "@/lib/mock/org";

const ICONS: Record<ArtifactType, LucideIcon> = {
  tender: FileStack, rfq: FileQuestion, requirement: ListChecks,
  "compliance-matrix": ClipboardCheck, "ga-drawing": DraftingCompass,
  "sld-drawing": DraftingCompass, "control-schematic": DraftingCompass,
  configuration: SlidersHorizontal, bom: Layers, "cost-sheet": Calculator,
  quotation: FileText, "purchase-order": FileCheck2, "engineering-package": Package,
  "work-order": Wrench, "test-certificate": BadgeCheck, "inspection-report": ClipboardList,
  "dispatch-note": Truck, "commissioning-report": PlugZap, "warranty-certificate": ShieldCheck,
  invoice: Receipt, email: Mail, "meeting-note": NotebookPen, photo: ImageIcon,
};

export function ArtifactCard({ artifact }: { artifact: Artifact }) {
  const Icon = ICONS[artifact.type] ?? FileText;
  const owner = userById(artifact.ownerId);
  const tone = artifactStatusTone[artifact.status];

  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-pop)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-ink-2">
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Mono className="font-semibold text-ink">{artifact.id}</Mono>
            <span className="rounded bg-surface-3 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-ink-3">
              R{artifact.currentRevision}
            </span>
            <Badge tone={tone} dot>{titleCase(artifact.status)}</Badge>
            {artifact.upstreamStale && (
              <Badge tone={healthTone["at-risk"]}>
                <GitBranch className="h-2.5 w-2.5" /> upstream changed
              </Badge>
            )}
          </div>
          <div className="mt-1 text-[13px] font-semibold text-ink">{artifact.title}</div>

          {/* Links — the traceability edges */}
          {artifact.links.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {artifact.links.map((l) => (
                <span key={l.toArtifactId + l.type}
                  className="inline-flex items-center gap-1 rounded-md border border-line-2 bg-surface-2 px-1.5 py-0.5 text-[10.5px] text-ink-3">
                  <ArrowUpRight className="h-2.5 w-2.5" />
                  {l.type.replace(/-/g, " ")} <Mono className="text-[10.5px] text-ink-2">{l.toArtifactId}</Mono>
                </span>
              ))}
            </div>
          )}

          {artifact.upstreamStale && artifact.meta?.note && (
            <div className="mt-2 rounded-lg border border-warn/20 bg-warn-soft/60 px-2.5 py-1.5 text-[11.5px] text-ink-2">
              {String(artifact.meta.note)}
            </div>
          )}

          <div className="mt-2 flex items-center gap-2 text-[11px] text-ink-4">
            <Avatar initials={owner.initials} name={owner.name} size={18} />
            <span>{owner.name}</span>
            <span>· updated {relDate(artifact.updatedAt)}</span>
            {artifact.revisions.length > 1 && <span>· {artifact.revisions.length} revisions</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
