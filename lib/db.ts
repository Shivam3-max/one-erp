import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  if (process.env.NODE_ENV === "production") {
    const bundledDb = path.join(process.cwd(), "prisma", "dev.db");
    const runtimeDir = path.join(tmpdir(), "one-erp");
    const runtimeDb = path.join(runtimeDir, "dev.db");

    try {
      if (existsSync(bundledDb) && !existsSync(runtimeDb)) {
        mkdirSync(runtimeDir, { recursive: true });
        copyFileSync(bundledDb, runtimeDb);
      }
      if (existsSync(runtimeDb)) return `file:${runtimeDb.replace(/\\/g, "/")}`;
    } catch {
      // Fall through to the local project path if tmp bootstrap fails.
    }
  }

  return "file:./prisma/dev.db";
}

const databaseUrl = resolveDatabaseUrl();
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
