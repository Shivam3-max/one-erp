import { prisma } from "./db";

/**
 * Append an audit-log entry. Best-effort: logging must never break the action
 * it records, so failures are swallowed (and surfaced to the server console).
 */
export async function logActivity(input: {
  tenantId: string;
  actorId: string;
  verb: string;
  target: string;
  projectId?: string | null;
}): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        tenantId: input.tenantId,
        actorId: input.actorId,
        verb: input.verb,
        target: input.target,
        projectId: input.projectId ?? null,
        at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("logActivity failed", err);
  }
}
