/**
 * Next.js startup hook — runs once when the server process boots, regardless of
 * how it was launched (next start, the standalone server, or a managed host's
 * own runner). It applies pending migrations and the idempotent seed, so a fresh
 * deploy always has its schema, tenant and users even if the host doesn't run
 * `server.mjs`.
 *
 * Production + Node runtime only; best-effort so it never blocks the server.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.ONEERP_SKIP_BOOTSTRAP === "1") return;

  const g = globalThis as unknown as { __oneerpBootstrapped?: boolean };
  if (g.__oneerpBootstrapped) return;
  g.__oneerpBootstrapped = true;

  try {
    const { execSync } = await import("node:child_process");
    const { existsSync } = await import("node:fs");
    const path = await import("node:path");
    const { resolveDatabaseUrl } = await import("./lib/db-url.mjs");

    const url = resolveDatabaseUrl();
    if (!url) {
      console.error("[bootstrap] no database configuration — skipping migrate/seed.");
      return;
    }

    // The standalone server runs from .next/standalone, where prisma/ is not
    // present — walk up from cwd to the project root that holds prisma/schema.prisma.
    let root: string | null = null;
    let dir = process.cwd();
    for (let i = 0; i < 6; i++) {
      if (existsSync(path.join(dir, "prisma", "schema.prisma"))) { root = dir; break; }
      const up = path.dirname(dir);
      if (up === dir) break;
      dir = up;
    }
    if (!root) {
      console.error("[bootstrap] prisma/schema.prisma not found from", process.cwd(), "— skipping migrate/seed.");
      return;
    }

    const env = { ...process.env, DATABASE_URL: url };
    console.log("[bootstrap] applying migrations…");
    execSync("npx --no-install prisma migrate deploy", { stdio: "inherit", env, cwd: root });
    console.log("[bootstrap] seeding (idempotent)…");
    execSync("npx --no-install tsx prisma/seed.ts", { stdio: "inherit", env, cwd: root });
    console.log("[bootstrap] database ready.");
  } catch (err) {
    console.error("[bootstrap] migrate/seed failed (server continues):", (err as Error)?.message ?? err);
  }
}
