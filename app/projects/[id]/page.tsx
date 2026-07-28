import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, MapPin, Wallet, Percent, CalendarClock, GitBranch,
  FileStack, ShieldCheck, Building2, Download, MoreHorizontal,
} from "lucide-react";
import { Badge, Mono } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardHeader, SectionLabel } from "@/components/ui/Card";
import { ProjectSpine } from "@/components/project/ProjectSpine";
import {
  getProject, getArtifacts, customerById, userById, stageIndex, LIFECYCLE,
} from "@/lib/mock";
import { STAGE_META } from "@/lib/lifecycle";
import { money, shortDate } from "@/lib/format";
import { healthTone, healthLabel, priorityTone, titleCase } from "@/lib/status";

const PHASES = [
  { label: "Acquire", from: 0, to: 2 },
  { label: "Engineer", from: 3, to: 6 },
  { label: "Contract", from: 7, to: 9 },
  { label: "Deliver", from: 10, to: 16 },
  { label: "Support", from: 17, to: 21 },
];

export default async function ProjectWorkspace({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const customer = customerById(project.customerId);
  const owner = userById(project.ownerId);
  const artifacts = getArtifacts(project.id);
  const curIdx = stageIndex(project.currentStage);
  const total = LIFECYCLE.length;
  const pct = Math.round(((curIdx + 1) / total) * 100);
  const activePhase = PHASES.find((ph) => curIdx >= ph.from && curIdx <= ph.to);

  const staleCount = artifacts.filter((a) => a.upstreamStale).length;
  const revisions = artifacts.reduce((s, a) => s + a.revisions.length, 0);
  const doneStages = project.stages.filter((s) => s.state === "done").length;

  return (
    <>
      {/* Header */}
      <Card className="mb-4 overflow-hidden">
        <div className="relative overflow-hidden border-b border-line px-5 py-4 sm:px-6">
          <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade" />
          <Link href="/projects" className="relative mb-2 inline-flex items-center gap-1 text-[12px] font-semibold text-ink-3 hover:text-brand">
            <ArrowLeft className="h-3.5 w-3.5" /> Projects
          </Link>
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Mono className="font-semibold text-brand">{project.id}</Mono>
                <Badge tone={priorityTone[project.priority]} dot>{titleCase(project.priority)} priority</Badge>
                <Badge tone={healthTone[project.health]} dot>{healthLabel[project.health]}</Badge>
              </div>
              <h1 className="mt-1.5 text-[22px] font-extrabold tracking-tight text-ink">{project.title}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-3">
                <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {customer.name}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {project.location}</span>
                <span className="font-medium text-ink-2">{project.productSummary}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] font-semibold text-ink-2 transition-colors hover:bg-surface-3">
                <Download className="h-4 w-4" /> Export
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-3 transition-colors hover:bg-surface-3">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress strip */}
        <div className="px-5 py-3.5 sm:px-6">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-semibold text-ink">
              Stage {curIdx + 1} of {total} · <span className="text-brand">{STAGE_META[project.currentStage].label}</span>
            </span>
            <span className="tnum font-mono text-ink-3">{pct}% through lifecycle</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex gap-1.5">
            {PHASES.map((ph) => (
              <div key={ph.label} className="flex-1">
                <div className={`text-center text-[10.5px] font-bold uppercase tracking-wide ${
                  ph.label === activePhase?.label ? "text-brand" : curIdx > ph.to ? "text-ok" : "text-ink-4"
                }`}>
                  {ph.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Spine */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Project spine"
              subtitle="Every document lives here — and references the one before it"
              action={<Badge tone={healthTone["on-track"]} dot>{artifacts.length} artifacts</Badge>}
            />
            <div className="px-4 pb-5 pt-1 sm:px-5">
              <ProjectSpine stages={project.stages} artifacts={artifacts} />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Facts */}
          <Card>
            <CardHeader title="Project facts" />
            <div className="space-y-3 px-5 pb-5">
              <Fact icon={Wallet} label="Contract value" value={money(project.value)} />
              {project.marginPct != null && (
                <Fact icon={Percent} label="Margin" value={`${project.marginPct.toFixed(1)}%`} />
              )}
              <Fact icon={CalendarClock} label="Target delivery" value={shortDate(project.targetDelivery)} />
              <Fact icon={Building2} label="Customer" value={customer.name}
                sub={`${titleCase(customer.type)} · Rating ${customer.rating}`} />
              <Fact icon={ShieldCheck} label="Standards" value="IS 2026 / IS 1180 / IEC 60076" />
              <div className="flex items-center gap-2 border-t border-line-2 pt-3">
                <Avatar initials={owner.initials} name={owner.name} size={30} />
                <div className="leading-tight">
                  <div className="text-[12.5px] font-semibold text-ink">{owner.name}</div>
                  <div className="text-[11px] text-ink-4">{owner.role} · project owner</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Traceability */}
          <Card>
            <CardHeader title="Traceability" subtitle="The project graph at a glance" />
            <div className="grid grid-cols-3 gap-2 px-5 pb-3">
              <MiniStat icon={FileStack} value={artifacts.length} label="Artifacts" />
              <MiniStat icon={GitBranch} value={revisions} label="Revisions" />
              <MiniStat icon={TriangleWarn} value={staleCount} label="Stale" tone={staleCount ? "warn" : "neutral"} />
            </div>
            {staleCount > 0 && (
              <div className="mx-5 mb-5 rounded-lg border border-warn/20 bg-warn-soft/50 px-3 py-2 text-[11.5px] text-ink-2">
                <span className="font-semibold text-ink">{staleCount} document{staleCount > 1 ? "s" : ""}</span>{" "}
                {staleCount > 1 ? "reference" : "references"} a source revision that has since changed. Review before release.
              </div>
            )}
            <div className="border-t border-line-2 px-5 py-3 text-[11.5px] text-ink-3">
              <span className="font-semibold text-ink">{doneStages}</span> of {total} lifecycle stages completed.
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function Fact({
  icon: Icon, label, value, sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-ink-3">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-4">{label}</div>
        <div className="text-[13px] font-semibold text-ink">{value}</div>
        {sub && <div className="text-[11px] text-ink-3">{sub}</div>}
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon, value, label, tone = "brand",
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number; label: string; tone?: "brand" | "warn" | "neutral";
}) {
  const color = tone === "warn" ? "text-warn" : tone === "neutral" ? "text-ink-3" : "text-brand";
  return (
    <div className="rounded-lg border border-line-2 bg-surface-2 px-2 py-2.5 text-center">
      <Icon className={`mx-auto h-4 w-4 ${color}`} />
      <div className="mt-1 tnum font-mono text-[16px] font-semibold text-ink">{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-ink-4">{label}</div>
    </div>
  );
}

function TriangleWarn({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path d="M12 3 2 20h20L12 3Z" strokeLinejoin="round" />
      <path d="M12 10v4" strokeLinecap="round" />
      <circle cx="12" cy="17.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
