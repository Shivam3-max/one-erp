"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { parseInput, createCustomerSchema, logCommunicationSchema } from "@/lib/validation";

export async function createCustomer(rawInput: {
  name: string;
  type: string;
  city: string;
  state: string;
  country: string;
  gstin: string;
  rating: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
}) {
  const user = await requireUser();
  if (!can(user, "crm.manage")) return { ok: false as const, error: "You don't have permission to add customers." };

  const parsed = parseInput(createCustomerSchema, rawInput);
  if (!parsed.ok) return { ok: false as const, error: parsed.error };
  const input = parsed.data;

  const duplicate = await prisma.customer.findFirst({
    where: { tenantId: user.tenantId, name: input.name },
    select: { id: true },
  });
  if (duplicate) return { ok: false as const, error: "A customer with this name already exists." };

  const id = `CUS-${randomUUID().slice(0, 8).toUpperCase()}`;
  await prisma.customer.create({
    data: {
      id,
      tenantId: user.tenantId,
      name: input.name,
      type: input.type,
      city: input.city,
      state: input.state,
      country: input.country,
      gstin: input.gstin || null,
      rating: input.rating,
      since: new Date().toISOString().slice(0, 10),
      contacts: {
        create: {
          name: input.contactName,
          role: input.contactRole,
          email: input.contactEmail,
          phone: input.contactPhone,
          primary: true,
        },
      },
    },
  });

  await logActivity({
    tenantId: user.tenantId,
    actorId: user.id,
    verb: "created customer",
    target: `${id} — ${input.name}`,
  });
  revalidatePath("/customers");
  revalidatePath("/");
  return { ok: true as const, id };
}

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
