"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import type { CommercialConfig, CustomerCommercial } from "@/lib/commercial";
import type { QuoteTemplate } from "@/lib/quote-template";

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

export async function saveQuoteTemplate(input: QuoteTemplate) {
  const user = await guard();
  await mergeTenantConfig(user.tenantId, { quoteTemplate: input });
  revalidatePath("/settings");
  revalidatePath("/quotations");
  return { ok: true };
}

/** Per-customer commercial overrides (discount, margin, loss-cap, terms). Blank fields inherit the tenant default. */
export async function saveCustomerCommercial(customerId: string, override: CustomerCommercial) {
  const user = await requireUser();
  if (!can(user, "crm.manage")) throw new Error("You don't have permission to edit customer terms.");
  const c = await prisma.customer.findFirst({ where: { id: customerId, tenantId: user.tenantId } });
  if (!c) return { ok: false, reason: "not-found" };
  const clean = Object.fromEntries(
    Object.entries(override).filter(([, v]) => v !== "" && v !== null && v !== undefined && !(typeof v === "number" && Number.isNaN(v))),
  );
  await prisma.customer.update({
    where: { id: customerId },
    data: { commercial: Object.keys(clean).length ? (clean as Prisma.InputJsonValue) : Prisma.DbNull },
  });
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/quotations");
  return { ok: true };
}
