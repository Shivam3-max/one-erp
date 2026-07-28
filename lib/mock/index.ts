import type { Artifact, Project, StageKey } from "../types";
import { LIFECYCLE, stageIndex } from "../lifecycle";
import { PROJECTS, projectById } from "./projects";
import { artifactsForProject, HERO_ARTIFACTS } from "./artifacts";
import { USERS, CUSTOMERS, TENANT, CURRENT_USER, userById, customerById } from "./org";

/**
 * DATA ACCESS LAYER
 * These functions are the ONLY thing screens import. In Phase 2 the bodies are
 * replaced with Prisma queries — signatures stay identical, screens untouched.
 */

export { TENANT, USERS, CUSTOMERS, CURRENT_USER, userById, customerById };
export { LIFECYCLE, stageIndex };

export function getProjects(): Project[] {
  return PROJECTS;
}

export function getProject(id: string): Project | undefined {
  return projectById(id);
}

export function getArtifacts(projectId: string): Artifact[] {
  const p = projectById(projectId);
  return p ? artifactsForProject(p) : [];
}

/** All artifacts across the portfolio — used for activity + staleness rollups. */
function allArtifacts(): Artifact[] {
  return PROJECTS.flatMap((p) => artifactsForProject(p));
}

const PO_INDEX = stageIndex("purchase-order");

export interface PortfolioMetrics {
  pipelineValue: number;      // INR, pre-PO opportunities
  orderBook: number;          // INR, won & in execution
  activeCount: number;
  atRiskCount: number;
  avgMargin: number;
  staleCount: number;
  wonThisQuarter: number;
}

export function getPortfolioMetrics(): PortfolioMetrics {
  let pipelineValue = 0;
  let orderBook = 0;
  let atRiskCount = 0;
  let marginSum = 0;
  let marginN = 0;

  for (const p of PROJECTS) {
    const idx = stageIndex(p.currentStage);
    if (idx < PO_INDEX) pipelineValue += p.value.amount;
    else if (p.health !== "closed") orderBook += p.value.amount;
    if (p.health === "at-risk" || p.health === "critical") atRiskCount++;
    if (p.marginPct != null) {
      marginSum += p.marginPct;
      marginN++;
    }
  }

  const staleCount = allArtifacts().filter((a) => a.upstreamStale).length;

  return {
    pipelineValue,
    orderBook,
    activeCount: PROJECTS.filter((p) => p.health !== "closed").length,
    atRiskCount,
    avgMargin: marginN ? marginSum / marginN : 0,
    staleCount,
    wonThisQuarter: PROJECTS.filter((p) => stageIndex(p.currentStage) >= PO_INDEX).length,
  };
}

/** Count + value of projects sitting at each lifecycle stage (funnel). */
export function getStageDistribution(): { key: StageKey; label: string; count: number; value: number }[] {
  return LIFECYCLE.map((meta) => {
    const at = PROJECTS.filter((p) => p.currentStage === meta.key);
    return {
      key: meta.key,
      label: meta.label,
      count: at.length,
      value: at.reduce((s, p) => s + p.value.amount, 0),
    };
  });
}

export interface FeedItem {
  id: string;
  projectId: string;
  projectTitle: string;
  actorId: string;
  summary: string;
  artifactId: string;
  artifactType: string;
  at: string;
  stale?: boolean;
}

/** Recent activity synthesized from the latest revision of every artifact. */
export function getActivityFeed(limit = 12): FeedItem[] {
  const items: FeedItem[] = [];
  for (const p of PROJECTS) {
    for (const a of artifactsForProject(p)) {
      const last = a.revisions[a.revisions.length - 1];
      items.push({
        id: `${a.id}-${last.rev}`,
        projectId: p.id,
        projectTitle: p.title,
        actorId: last.authorId,
        summary: last.changeSummary,
        artifactId: a.id,
        artifactType: a.type,
        at: a.updatedAt,
        stale: a.upstreamStale,
      });
    }
  }
  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}

/** Artifacts flagged as stale across the portfolio — the attention queue. */
export function getStaleArtifacts(): { artifact: Artifact; project: Project }[] {
  const out: { artifact: Artifact; project: Project }[] = [];
  for (const p of PROJECTS) {
    for (const a of artifactsForProject(p)) {
      if (a.upstreamStale) out.push({ artifact: a, project: p });
    }
  }
  return out;
}

export { HERO_ARTIFACTS };
