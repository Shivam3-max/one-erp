"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function saveConfiguration(input: {
  projectId: string;
  familyId: string;
  familyName: string;
  values: Record<string, unknown>;
  marginPct: number;
  summary: string;
}) {
  const t = await prisma.tenant.findFirst({ select: { id: true } });
  const tenantId = t?.id ?? "T-CANDRON";
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
