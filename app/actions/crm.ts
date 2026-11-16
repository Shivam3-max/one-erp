"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { parseInput, logCommunicationSchema } from "@/lib/validation";

export async function logCommunication(rawInput: {
  customerId: string;
  type: string;
  subject: string;
  summary: string;
}) {
  const user = await requireUser();
  if (!can(user, "crm.manage")) throw new Error("You don't have permission to log communications.");
  const parsed = parseInput(logCommunicationSchema, rawInput);
  if (!parsed.ok) return { ok: false, reason: parsed.error };
  const input = parsed.data;

  // The customer must belong to the caller's tenant.
  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, tenantId: user.tenantId },
    select: { id: true },
  });
  if (!customer) return { ok: false, reason: "not-found" };

  await prisma.communication.create({
    data: {
      tenantId: user.tenantId,
      customerId: customer.id,
      type: input.type,
      subject: input.subject,
      summary: input.summary,
      userId: user.id,
      date: new Date().toISOString().slice(0, 10),
    },
  });
  revalidatePath(`/customers/${input.customerId}`);
  return { ok: true };
}
