"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export async function logCommunication(input: {
  customerId: string;
  type: string;
  subject: string;
  summary: string;
}) {
  const user = await requireUser();
  if (!can(user, "crm.manage")) throw new Error("You don't have permission to log communications.");
  if (!input.subject?.trim()) return { ok: false, reason: "subject" };

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
      subject: input.subject.trim(),
      summary: input.summary?.trim() || "",
      userId: user.id,
      date: new Date().toISOString().slice(0, 10),
    },
  });
  revalidatePath(`/customers/${input.customerId}`);
  return { ok: true };
}
