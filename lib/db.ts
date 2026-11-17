import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "./db-url.mjs";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Lazy: the client (and the DATABASE_URL / DB_* requirement) is resolved on first
// use, not at import. This lets `next build` load modules that import `prisma`
// without a database configured; a real request still fails closed if it is missing.
function client(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const url = resolveDatabaseUrl();
  if (!url) {
    throw new Error(
      "No database configuration. Set DATABASE_URL, or the discrete DB_HOST / DB_NAME / DB_USER (+ DB_PASSWORD) variables.",
    );
  }
  const instance = new PrismaClient({ datasources: { db: { url } } });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = instance;
  return instance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const c = client();
    const value = (c as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(c) : value;
  },
});
