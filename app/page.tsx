import Link from "next/link";
import {
  Wallet, TrendingUp, FolderKanban, Percent, TriangleAlert,
  GitBranch, Clock, PieChart, Activity as ActivityIcon, Rocket, Settings as SettingsIcon, Building2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Stat } from "@/components/ui/Stat";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, Mono } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Donut } from "@/components/ui/Donut";
import {
  getPortfolioMetrics, getStageDistribution, getProjects,
  getStaleArtifacts, getActivityFeed, getCustomerMap, getUserMap, getTenant,
} from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { stageIndex } from "@/lib/lifecycle";
import { money, shortDate, relDate, fiscalQuarter } from "@/lib/format";
import { healthTone, healthLabel } from "@/lib/status";
import { ACCESS_LABEL } from "@/lib/permissions";

const inr = (amount: number) => money({ amount, currency: "INR" });

const HEALTH = [
  { key: "on-track", label: "On track", color: "#1f9d6b" },
  { key: "at-risk", label: "At risk", color: "#c8891f" },
  { key: "critical", label: "Critical", color: "#d04545" },
  { key: "closed", label: "Closed", color: "#8891a2" },
];
// Lifecycle phases, light → dark as a project progresses (ordered → sequential blue).
const PHASES = [
  { label: "Acquire", from: 0, to: 2, color: "#c4d2f9" },
  { label: "Engineer", from: 3, to: 6, color: "#8fabf3" },
  { label: "Contract", from: 7, to: 9, color: "#5a80ee" },
  { label: "Deliver", from: 10, to: 16, color: "#3059dd" },
  { label: "Support", from: 17, to: 21, color: "#1c3ea8" },
];

export default async function OverviewPage() {
  const [m, stageDistAll, projects, stale, feed, customerMap, userMap, tenant, user] = await Promise.all([
    getPortfolioMetrics(), getStageDistribution(), getProjects(),
    getStaleArtifacts(), getActivityFeed(7), getCustomerMap(), getUserMap(), getTenant(), getCurrentUser(),
  ]);
  const stageDist = stageDistAll.filter((s) => s.count > 0);
  const maxVal = Math.max(...stageDist.map((s) => s.value), 1);
  const customerCount = new Set(projects.map((p) => p.customerId)).size;
  const attention = projects
    .filter((p) => p.health === "at-risk" || p.health === "critical")
    .sort((a, b) => b.value.amount - a.value.amount);

  const healthSegments = HEALTH.map((h) => ({ label: h.label, color: h.color, value: projects.filter((p) => p.health === h.key).length }));
  const phaseSegments = PHASES.map((ph) => ({
    label: ph.label, color: ph.color,
    value: projects.filter((p) => { const i = stageIndex(p.currentStage); return i >= ph.from && i <= ph.to; }).reduce((s, p) => s + p.value.amount, 0),
  }));
  const portfolioValue = projects.reduce((s, p) => s + p.value.amount, 0);
  const hasProjects = projects.length > 0;

  return (
    <>
      <PageHeader
        eyebrow={`${tenant?.name ?? "Workspace"} · ${user ? ACCESS_LABEL[user.accessLevel] ?? user.role : "Overview"}`}
        title="Overview"
        subtitle="Every inquiry is a project. Every project moves along one spine."
        action={
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink-2">
            <Clock className="h-3.5 w-3.5 text-ink-4" /> This quarter · {fiscalQuarter()}
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Order Book" value={inr(m.orderBook)} icon={Wallet} accent="brand"
          sub="in execution" />
        <Stat label="Live Pipeline" value={inr(m.pipelineValue)} icon={TrendingUp} accent="copper"
          sub="pre-order" />
        <Stat label="Active Projects" value={String(m.activeCount)} icon={FolderKanban}
          sub={`across ${customerCount} customer${customerCount === 1 ? "" : "s"}`} />
        <Stat label="Avg Margin" value={m.avgMargin.toFixed(1)} unit="%" icon={Percent} accent="ok"
          sub="won orders" />
        <Stat label="Needs Attention" value={String(m.atRiskCount + m.staleCount)} icon={TriangleAlert} accent="warn"
          sub={`${m.atRiskCount} at-risk · ${m.staleCount} stale`} />
      </div>

      {/* First-run / empty workspace */}
      {!hasProjects && (
        <Card className="mt-4">
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <Rocket className="h-7 w-7" />
            </span>
            <div>
              <h2 className="text-[18px] font-bold text-ink">Your workspace is ready</h2>
              <p className="mx-auto mt-1 max-w-md text-[13px] text-ink-3">
                There are no projects yet. Set up your workspace, add your customers, then create your first project — every inquiry becomes a project on the lifecycle spine.
              </p>
            </div>
            <div className="mt-1 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
              <Link href="/settings" className="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-4 py-4 text-center transition-colors hover:border-brand-line hover:bg-brand-soft/50">
                <SettingsIcon className="h-5 w-5 text-brand" />
                <span className="text-[12.5px] font-semibold text-ink">1 · Configure</span>
                <span className="text-[11px] text-ink-4">Rate card, terms, families</span>
              </Link>
              <Link href="/customers" className="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-4 py-4 text-center transition-colors hover:border-brand-line hover:bg-brand-soft/50">
                <Building2 className="h-5 w-5 text-brand" />
                <span className="text-[12.5px] font-semibold text-ink">2 · Add customers</span>
                <span className="text-[11px] text-ink-4">Contacts & terms</span>
              </Link>
              <Link href="/projects" className="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-4 py-4 text-center transition-colors hover:border-brand-line hover:bg-brand-soft/50">
                <FolderKanban className="h-5 w-5 text-brand" />
                <span className="text-[12.5px] font-semibold text-ink">3 · New project</span>
                <span className="text-[11px] text-ink-4">Use ＋ New Project, top right</span>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Charts */}
      {hasProjects && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Order book by phase" subtitle="Where the portfolio value sits"
              action={<PieChart className="h-4 w-4 text-ink-4" />} />
            <div className="px-5 pb-5 pt-1">
              <Donut segments={phaseSegments} centerValue={inr(portfolioValue)} centerLabel="Portfolio" formatValue={inr} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Projects by health" subtitle="Delivery risk across the portfolio"
              action={<ActivityIcon className="h-4 w-4 text-ink-4" />} />
            <div className="px-5 pb-5 pt-1">
              <Donut segments={healthSegments} centerValue={String(projects.length)} centerLabel="Projects" />
            </div>
          </Card>
        </div>
      )}

      {hasProjects && (
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Lifecycle load */}
          <Card>
            <CardHeader
              title="Portfolio across the lifecycle"
              subtitle="Where the order book sits, by stage"
              action={<Badge tone={healthTone["on-track"]} dot>{stageDist.length} active stages</Badge>}
            />
            <div className="space-y-2 px-5 pb-5">
              {stageDist.map((s) => (
                <div key={s.key} className="flex items-center gap-3">
                  <div className="w-36 shrink-0 truncate text-[12.5px] font-medium text-ink-2">{s.label}</div>
                  <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-surface-3">
                    <div
                      className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-brand to-brand-2"
                      style={{ width: `${Math.max((s.value / maxVal) * 100, 6)}%` }}
                    />
                  </div>
                  <div className="w-8 shrink-0 text-center">
                    <span className="tnum font-mono text-[12px] font-semibold text-ink">{s.count}</span>
                  </div>
                  <div className="w-20 shrink-0 text-right tnum font-mono text-[12px] font-medium text-ink-3">
                    {inr(s.value)}
                  </div>
                </div>
              ))}
              {stageDist.length === 0 && (
                <div className="py-8 text-center text-[12.5px] text-ink-4">No projects in the pipeline yet.</div>
              )}
            </div>
          </Card>

          {/* Attention: projects */}
          <Card>
            <CardHeader
              title="Projects needing attention"
              subtitle="At-risk & critical — sorted by value at stake"
              action={<Link href="/projects" className="text-[12px] font-semibold text-brand hover:underline">All projects →</Link>}
            />
            <div className="divide-y divide-line-2">
              {attention.map((p) => {
                const cust = customerMap[p.customerId];
                const owner = userMap[p.ownerId];
                return (
                  <Link key={p.id} href={`/projects/${p.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-2">
                    <span className={`h-8 w-1 shrink-0 rounded-full ${healthTone[p.health].dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13.5px] font-semibold text-ink">{p.title}</span>
                        <Badge tone={healthTone[p.health]} dot>{healthLabel[p.health]}</Badge>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-ink-3">
                        <Mono>{p.id}</Mono> · {cust.name} · {p.productSummary}
                      </div>
                    </div>
                    <div className="hidden text-right sm:block">
                      <div className="tnum font-mono text-[13px] font-semibold text-ink">{inr(p.value.amount)}</div>
                      <div className="text-[11px] text-ink-4">due {shortDate(p.targetDelivery)}</div>
                    </div>
                    <Avatar initials={owner.initials} name={owner.name} size={26} />
                  </Link>
                );
              })}
              {attention.length === 0 && (
                <div className="px-5 py-8 text-center text-[12.5px] text-ink-4">Nothing at risk — all projects on track.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Attention queue — the signature: upstream changed */}
          <Card className="overflow-hidden">
            <div className="border-b border-line bg-warn-soft/50 px-5 py-3">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-warn" strokeWidth={2.5} />
                <h3 className="text-[13px] font-bold text-ink">Traceability alerts</h3>
              </div>
              <p className="mt-0.5 text-[11.5px] text-ink-3">
                Downstream documents whose source revised. Flagged, never silently changed.
              </p>
            </div>
            <div className="divide-y divide-line-2">
              {stale.map(({ artifact, project }) => (
                <Link key={artifact.id} href={`/projects/${project.id}`}
                  className="block px-5 py-3 transition-colors hover:bg-surface-2">
                  <div className="flex items-center justify-between gap-2">
                    <Mono className="font-semibold text-ink">{artifact.id}</Mono>
                    <Badge tone={healthTone["at-risk"]}>upstream changed</Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-ink-2">{String(artifact.meta?.note ?? "Source artifact revised.")}</p>
                  <div className="mt-1 text-[11px] text-ink-4">{project.title}</div>
                </Link>
              ))}
              {stale.length === 0 && (
                <div className="px-5 py-8 text-center text-[12.5px] text-ink-4">No traceability alerts.</div>
              )}
            </div>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader title="Recent activity" />
            <div className="space-y-3.5 px-5 pb-5">
              {feed.map((f) => {
                const actor = userMap[f.actorId];
                return (
                  <div key={f.id} className="flex gap-2.5">
                    <Avatar initials={actor.initials} name={actor.name} size={26} />
                    <div className="min-w-0 flex-1 leading-snug">
                      <p className="text-[12.5px] text-ink-2">
                        <span className="font-semibold text-ink">{actor.name.split(" ")[0]}</span>{" "}
                        {f.summary}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-4">
                        <Mono>{f.artifactId}</Mono>
                        {f.stale && <Badge tone={healthTone["at-risk"]}>stale</Badge>}
                        <span>· {relDate(f.at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {feed.length === 0 && (
                <div className="py-6 text-center text-[12.5px] text-ink-4">No recent activity.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
      )}
    </>
  );
}
