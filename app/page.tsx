import Link from "next/link";
import {
  Wallet, TrendingUp, FolderKanban, Percent, TriangleAlert,
  ArrowRight, GitBranch, Clock,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Stat } from "@/components/ui/Stat";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, Mono } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import {
  getPortfolioMetrics, getStageDistribution, getProjects,
  getStaleArtifacts, getActivityFeed, getCustomerMap, getUserMap,
} from "@/lib/data";
import { money, shortDate, relDate } from "@/lib/format";
import { healthTone, healthLabel } from "@/lib/status";

const inr = (amount: number) => money({ amount, currency: "INR" });

export default async function OverviewPage() {
  const [m, stageDistAll, projects, stale, feed, customerMap, userMap] = await Promise.all([
    getPortfolioMetrics(), getStageDistribution(), getProjects(),
    getStaleArtifacts(), getActivityFeed(7), getCustomerMap(), getUserMap(),
  ]);
  const stageDist = stageDistAll.filter((s) => s.count > 0);
  const maxVal = Math.max(...stageDist.map((s) => s.value), 1);
  const attention = projects
    .filter((p) => p.health === "at-risk" || p.health === "critical")
    .sort((a, b) => b.value.amount - a.value.amount);

  return (
    <>
      <PageHeader
        eyebrow="CANDRON Electricals · Director view"
        title="Overview"
        subtitle="Every inquiry is a project. Every project moves along one spine."
        action={
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink-2">
            <Clock className="h-3.5 w-3.5 text-ink-4" /> This quarter · Q3 FY26
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Order Book" value={inr(m.orderBook)} icon={Wallet} accent="brand"
          delta={{ value: "12.4%", up: true }} sub="in execution" />
        <Stat label="Live Pipeline" value={inr(m.pipelineValue)} icon={TrendingUp} accent="copper"
          delta={{ value: "8.1%", up: true }} sub="pre-order" />
        <Stat label="Active Projects" value={String(m.activeCount)} icon={FolderKanban}
          sub="across 9 customers" />
        <Stat label="Avg Margin" value={m.avgMargin.toFixed(1)} unit="%" icon={Percent} accent="ok"
          delta={{ value: "0.6%", up: false }} sub="won orders" />
        <Stat label="Needs Attention" value={String(m.atRiskCount + m.staleCount)} icon={TriangleAlert} accent="warn"
          sub={`${m.atRiskCount} at-risk · ${m.staleCount} stale`} />
      </div>

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
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
