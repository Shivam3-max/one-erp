import { z } from "zod";

/**
 * Input schemas for Server Actions. Actions parse untrusted client input through
 * these before touching the database, returning a typed error on failure.
 */

export const signInSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  company: z.string().trim().min(1, "Company name is required").max(120),
  name: z.string().trim().min(1, "Your name is required").max(120),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
});

export const priorityEnum = z.enum(["low", "medium", "high", "critical"]);

export const createProjectSchema = z.object({
  title: z.string().trim().min(1, "Project title is required").max(200),
  customerId: z.string().trim().min(1, "Customer is required"),
  productSummary: z.string().trim().max(300).default("To be configured"),
  location: z.string().trim().max(200).default("—"),
  valueCr: z.coerce.number().finite().min(0).max(100000).default(0),
  priority: priorityEnum.default("medium"),
  targetDelivery: z.string().trim().max(40).optional(),
  ownerId: z.string().trim().optional(),
});

export const commTypeEnum = z.enum(["email", "call", "meeting", "site-visit"]);

export const logCommunicationSchema = z.object({
  customerId: z.string().trim().min(1),
  type: commTypeEnum,
  subject: z.string().trim().min(1, "Subject is required").max(200),
  summary: z.string().trim().max(2000).default(""),
});

export const saveConfigurationSchema = z.object({
  projectId: z.string().trim().min(1),
  familyId: z.string().trim().min(1),
  familyName: z.string().trim().min(1),
  values: z.record(z.string(), z.unknown()),
  marginPct: z.coerce.number().finite().min(0).max(100),
  summary: z.string().trim().min(1).max(300),
});

export const saveEstimateSchema = z.object({
  projectId: z.string().trim().min(1),
  summary: z.string().trim().min(1).max(300),
  estimatedCost: z.coerce.number().finite().min(0),
  sellingPrice: z.coerce.number().finite().min(0),
  marginPct: z.coerce.number().finite().min(0).max(100),
});

/** Parse input, returning a discriminated result with a single human-readable error. */
export function parseInput<S extends z.ZodTypeAny>(schema: S, input: unknown):
  | { ok: true; data: z.output<S> }
  | { ok: false; error: string } {
  const res = schema.safeParse(input);
  if (res.success) return { ok: true, data: res.data };
  return { ok: false, error: res.error.issues[0]?.message ?? "Invalid input." };
}
