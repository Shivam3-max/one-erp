import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { captureException } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * Liveness + readiness probe for load balancers / uptime monitors / Hostinger.
 * 200 when the process is up and the database answers; 503 when the DB is down.
 * Returns no tenant or user data.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", db: "up", ms: Date.now() - startedAt },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    captureException(err, { where: "health" });
    return NextResponse.json(
      { status: "degraded", db: "down" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
