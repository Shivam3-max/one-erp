"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function logCommunication(input: {
  customerId: string;
  type: string;
  subject: string;
  summary: string;
  userId?: string;
}) {
  const t = await prisma.tenant.findFirst({ select: { id: true } });
  await prisma.communication.create({
    data: {
      tenantId: t?.id ?? "T-CANDRON",
      customerId: input.customerId,
      type: input.type,
      subject: input.subject,
      summary: input.summary || "",
      userId: input.userId || "U-01",
      date: new Date().toISOString().slice(0, 10),
    },
  });
  revalidatePath(`/customers/${input.customerId}`);
  return { ok: true };
}
