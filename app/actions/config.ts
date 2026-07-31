"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

async function authz() {
  const user = await requireUser();
  if (!can(user, "config.save")) throw new Error("You don't have permission to save to a project.");
  return user;
}

export async function saveConfiguration(input: {
  projectId: string;
  familyId: string;
  familyName: string;
  values: Record<string, unknown>;
  marginPct: number;
  summary: string;
}) {
  const user = await authz();
  const tenantId = user.tenantId;
  const now = new Date().toISOString().slice(0, 10);

  const cfg = await prisma.configuration.create({
    data: {
      tenantId, projectId: input.projectId, familyId: input.familyId, name: input.summary,
      values: input.values as object, marginPct: input.marginPct, validated: true, createdAt: now, createdBy: "U-03",
    },
  });

  const num = input.projectId.split("-").pop() ?? "0000";
  const artId = `CFG-${num}-${cfg.id.slice(-4).toUpperCase()}`;
  await prisma.artifact.create({
    data: {
      id: artId, tenantId, projectId: input.projectId, type: "configuration",
      title: `Configuration — ${input.summary}`, status: "approved", stage: "technical-design",
      currentRevision: 1, ownerId: "U-03", updatedAt: now, upstreamStale: false,
      revisions: { create: [{ rev: 1, createdAt: now, authorId: "U-03", changeSummary: `Configured ${input.familyName} (${input.summary}).` }] },
    },
  });

  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath("/documents");
  return { ok: true, artifactId: artId };
}

/** Save an estimate as a cost-sheet artifact on a project. */
export async function saveEstimate(input: {
  projectId: string;
  summary: string;
  estimatedCost: number;
  sellingPrice: number;
  marginPct: number;
}) {
  const user = await authz();
  const now = new Date().toISOString().slice(0, 10);
  const num = input.projectId.split("-").pop() ?? "0000";
  const artId = `COST-${num}-${Date.now().toString().slice(-4)}`;
  await prisma.artifact.create({
    data: {
      id: artId, tenantId: user.tenantId, projectId: input.projectId, type: "cost-sheet",
      title: `Cost Sheet — ${input.summary}`, status: "approved", stage: "estimation",
      currentRevision: 1, ownerId: user.id, updatedAt: now, upstreamStale: false,
      meta: { estimatedCost: Math.round(input.estimatedCost), sellingPrice: Math.round(input.sellingPrice), marginPct: input.marginPct },
      revisions: { create: [{ rev: 1, createdAt: now, authorId: user.id, changeSummary: `Estimate: cost ₹${Math.round(input.estimatedCost).toLocaleString("en-IN")} @ ${input.marginPct}% margin.` }] },
    },
  });
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath("/documents");
  return { ok: true, artifactId: artId };
}
