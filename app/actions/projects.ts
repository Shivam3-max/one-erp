"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { LIFECYCLE } from "@/lib/lifecycle";
import { requireUser } from "@/lib/auth";
import { can, type Perm } from "@/lib/permissions";

async function authorize(perm: Perm) {
  const user = await requireUser();
  if (!can(user, perm)) throw new Error("You don't have permission to perform this action.");
  return user;
}

const today = () => new Date().toISOString().slice(0, 10);

export async function createProject(input: {
  title: string;
  customerId: string;
  productSummary: string;
  location: string;
  valueCr: number;
  priority: string;
  targetDelivery?: string;
  ownerId?: string;
}) {
  const user = await authorize("project.create");
  const tId = user.tenantId;
  const existing = await prisma.project.findMany({ where: { id: { startsWith: "PRJ-2026-" } }, select: { id: true } });
  const maxN = existing.reduce((m, p) => {
    const n = parseInt(p.id.split("-").pop() || "0", 10);
    return Math.max(m, Number.isNaN(n) ? 0 : n);
  }, 0);
  const id = `PRJ-2026-${String(maxN + 1).padStart(4, "0")}`;
  const now = today();

  await prisma.project.create({
    data: {
      id,
      tenantId: tId,
      title: input.title,
      customerId: input.customerId,
      ownerId: input.ownerId || user.id,
      currentStage: "lead",
      health: "on-track",
      priority: input.priority,
      value: Math.round((input.valueCr || 0) * 1_00_00_000),
      currency: "INR",
      createdAt: now,
      targetDelivery: input.targetDelivery || null,
      location: input.location,
      productSummary: input.productSummary,
      tags: [],
      stages: {
        create: LIFECYCLE.map((m) => ({
          key: m.key,
          order: m.order,
          state: m.order === 0 ? "active" : "pending",
          startedAt: m.order === 0 ? now : null,
        })),
      },
    },
  });

  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath("/pipeline");
  return { id };
}

/** Move a project one step forward along the lifecycle spine. */
export async function advanceProjectStage(projectId: string) {
  await authorize("project.advance");
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { stages: true } });
  if (!project) return { ok: false };
  const ordered = [...project.stages].sort((a, b) => a.order - b.order);
  const curIdx = ordered.findIndex((s) => s.state === "active");
  if (curIdx < 0 || curIdx >= ordered.length - 1) return { ok: false };
  const now = today();
  const cur = ordered[curIdx];
  const next = ordered[curIdx + 1];

  await prisma.$transaction([
    prisma.projectStage.update({ where: { id: cur.id }, data: { state: "done", completedAt: now } }),
    prisma.projectStage.update({ where: { id: next.id }, data: { state: "active", startedAt: now } }),
    prisma.project.update({ where: { id: projectId }, data: { currentStage: next.key } }),
  ]);

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/");
  return { ok: true, stage: next.key };
}

export async function setProjectHealth(projectId: string, health: string) {
  await prisma.project.update({ where: { id: projectId }, data: { health } });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/");
  return { ok: true };
}
