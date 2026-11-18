// Production startup wrapper for managed Node hosting (Hostinger / Passenger).
// Point the app's "startup file" at this. On every boot it:
//   1. applies any pending Prisma migrations (idempotent — safe to run each time),
//   2. then starts the Next.js standalone server IN THIS PROCESS.
//
// The runtime environment must provide the DB config (DATABASE_URL or the
// discrete DB_* vars) and AUTH_SECRET. Seeding is NOT done here — it is
// destructive and is a one-time manual step (`npm run db:seed`).
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolveDatabaseUrl } from "./lib/db-url.mjs";

const url = resolveDatabaseUrl();
if (!url) {
  console.error(
    "[startup] No database configuration. Set DATABASE_URL, or DB_HOST / DB_NAME / DB_USER (+ DB_PASSWORD).",
  );
  process.exit(1);
}

try {
  console.log("[startup] applying database migrations (prisma migrate deploy)…");
  execSync("npx --no-install prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
  console.log("[startup] migrations up to date.");
} catch (err) {
  console.error("[startup] migration failed — not starting the server.", err?.message ?? err);
  process.exit(1);
}

// Idempotent seed: ensures the tenant + users exist and seeds demo content on an
// empty workspace. Safe to run every boot; best-effort so it never blocks start.
try {
  console.log("[startup] ensuring seed data (prisma/seed.ts)…");
  execSync("npx --no-install tsx prisma/seed.ts", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
} catch (err) {
  console.error("[startup] seed step failed (continuing to start the server).", err?.message ?? err);
}

const standalone = "./.next/standalone/server.js";
if (!existsSync(standalone)) {
  console.error(
    "[startup] .next/standalone/server.js not found. Run `npm run build` (it assembles the standalone server).",
  );
  process.exit(1);
}

// Boot the Next standalone server in-process (it starts listening on PORT).
console.log("[startup] starting Next server…");
await import(standalone);
