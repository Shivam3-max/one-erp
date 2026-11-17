import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "./db-url.mjs";

const databaseUrl = resolveDatabaseUrl();
if (!databaseUrl) {
  throw new Error(
    "No database configuration. Set DATABASE_URL, or the discrete DB_HOST / DB_NAME / DB_USER (+ DB_PASSWORD) variables.",
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ datasources: { db: { url: databaseUrl } } });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
