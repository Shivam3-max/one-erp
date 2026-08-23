"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { DEFAULT_FACTORS, RATES, type CostFactors, type Rate } from "@/lib/configurator/model";

async function guard() {
  const user = await requireUser();
  if (!can(user, "settings.manage")) throw new Error("You don't have permission to manage rate cards.");
  return user;
}

type RateMap = Record<string, Rate>;

function revalidate() {
  revalidatePath("/settings");
  revalidatePath("/configurator");
  revalidatePath("/estimation");
}

/** Create a new rate card, cloning the active card's rates + factors as a starting point. */
export async function createRateCard(input: { label: string; effectiveFrom: string }) {
  const user = await guard();
  const source = await prisma.rateCard.findFirst({ where: { tenantId: user.tenantId, active: true } });
  const rates = (source?.rates as RateMap | null) ?? RATES;
  const factors = ((source?.factors as CostFactors | null) ?? DEFAULT_FACTORS);
  await prisma.rateCard.create({
    data: {
      tenantId: user.tenantId,
      label: input.label.trim() || "New rate card",
      effectiveFrom: input.effectiveFrom || new Date().toISOString().slice(0, 10),
      active: false,
      rates: rates as object,
      factors: factors as object,
    },
  });
  revalidate();
  return { ok: true };
}

/** Persist edited material rates + cost factors for a card. */
export async function saveRateCard(id: string, data: { rates: RateMap; factors: CostFactors }) {
  const user = await guard();
  const card = await prisma.rateCard.findFirst({ where: { id, tenantId: user.tenantId } });
  if (!card) return { ok: false, reason: "not-found" };
  await prisma.rateCard.update({ where: { id }, data: { rates: data.rates as object, factors: data.factors as object } });
  revalidate();
  return { ok: true };
}

/** Make one card the single active card for the tenant. */
export async function activateRateCard(id: string) {
  const user = await guard();
  const card = await prisma.rateCard.findFirst({ where: { id, tenantId: user.tenantId } });
  if (!card) return { ok: false, reason: "not-found" };
  await prisma.$transaction([
    prisma.rateCard.updateMany({ where: { tenantId: user.tenantId, active: true }, data: { active: false } }),
    prisma.rateCard.update({ where: { id }, data: { active: true } }),
  ]);
  revalidate();
  return { ok: true };
}

/** Delete a card (never the active one, never the last remaining card). */
export async function deleteRateCard(id: string) {
  const user = await guard();
  const card = await prisma.rateCard.findFirst({ where: { id, tenantId: user.tenantId } });
  if (!card) return { ok: false, reason: "not-found" };
  if (card.active) return { ok: false, reason: "active" };
  const count = await prisma.rateCard.count({ where: { tenantId: user.tenantId } });
  if (count <= 1) return { ok: false, reason: "last" };
  await prisma.rateCard.delete({ where: { id } });
  revalidate();
  return { ok: true };
}
