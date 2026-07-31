"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

async function guard() {
  const user = await requireUser();
  if (!can(user, "settings.manage")) throw new Error("You don't have permission to manage settings.");
  return user;
}

export async function toggleFamilyActive(id: string, active: boolean) {
  await guard();
  await prisma.productFamily.update({ where: { id }, data: { active } });
  revalidatePath("/settings");
  revalidatePath("/configurator");
  return { ok: true };
}

async function tid() {
  const t = await prisma.tenant.findFirst({ select: { id: true } });
  return t?.id ?? "T-CANDRON";
}

export async function addFamily(input: { name: string; category: string; blurb: string }) {
  const user = await guard();
  const id = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 30) + "-" + Date.now().toString().slice(-4);
  await prisma.productFamily.create({
    data: { id, tenantId: user.tenantId, name: input.name, category: input.category || "General", blurb: input.blurb || "Custom product family", attributeCount: 0, active: true },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function addStandard(input: { code: string; title: string; scope: string }) {
  const user = await guard();
  await prisma.standardRef.create({
    data: { tenantId: input.scope === "tenant" ? user.tenantId : null, code: input.code, title: input.title || input.code, scope: input.scope || "tenant" },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function inviteUser(input: { name: string; role: string; department: string; email: string }) {
  const user = await guard();
  const id = `${user.tenantId}-U${Date.now().toString().slice(-5)}`;
  const initials = input.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "U";
  await prisma.user.create({
    data: { id, tenantId: user.tenantId, name: input.name, initials, role: input.role || "Member", department: input.department || "sales", email: input.email, accessLevel: "member" },
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function saveTenant(input: { name?: string; brandColor?: string; primaryCurrency?: string }) {
  const user = await guard();
  const t = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
  if (!t) return { ok: false };
  await prisma.tenant.update({
    where: { id: t.id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.brandColor ? { brandColor: input.brandColor } : {}),
      ...(input.primaryCurrency ? { primaryCurrency: input.primaryCurrency } : {}),
    },
  });
  revalidatePath("/settings");
  return { ok: true };
}
