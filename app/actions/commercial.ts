"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import type { CommercialConfig } from "@/lib/commercial";

async function guard() {
  const user = await requireUser();
  if (!can(user, "settings.manage")) throw new Error("You don't have permission to manage commercial settings.");
  return user;
}

/** Merge a partial patch into the tenant's config blob (creates the row on first write). */
export async function mergeTenantConfig(tenantId: string, patch: Record<string, unknown>) {
  const existing = await prisma.tenantConfig.findUnique({ where: { tenantId } });
  const data = { ...((existing?.data as Record<string, unknown> | null) ?? {}), ...patch } as Prisma.InputJsonValue;
  await prisma.tenantConfig.upsert({
    where: { tenantId },
    create: { tenantId, data },
    update: { data },
  });
}

export async function saveCommercialConfig(input: CommercialConfig) {
  const user = await guard();
  await mergeTenantConfig(user.tenantId, { commercial: input });
  revalidatePath("/settings");
  revalidatePath("/estimation");
  revalidatePath("/quotations");
  return { ok: true };
}
