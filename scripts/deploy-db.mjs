// Runs at the start of `npm run build` so a managed host (Hostinger) applies
// migrations and the idempotent seed on every deploy, with no terminal needed.
//
// Best-effort: it NEVER fails the build. If the build environment can't reach the
// database, it logs and moves on — the runtime bootstrap (instrumentation.ts /
// server.mjs) applies migrations + seed again when the app boots, where the
// database is reachable.
import "dotenv/config";
import { execSync } from "node:child_process";
import { resolveDatabaseUrl } from "../lib/db-url.mjs";

// Skip in CI — the CI build only verifies compilation and has no real database.
if (process.env.CI) {
  console.log("[deploy-db] CI detected — skipping migrate/seed.");
  process.exit(0);
}

let url = resolveDatabaseUrl();
if (!url) {
  console.warn("[deploy-db] No database configuration — skipping migrate/seed.");
  process.exit(0);
}
// Bound connection attempts so a build with an unreachable DB fails fast.
if (!/[?&]connect_timeout=/.test(url)) url += (url.includes("?") ? "&" : "?") + "connect_timeout=10";

const env = { ...process.env, DATABASE_URL: url };
const run = (cmd) => {
  try {
    execSync(cmd, { stdio: "inherit", env });
  } catch (err) {
    console.warn(`[deploy-db] "${cmd}" did not complete (continuing):`, err?.message ?? err);
  }
};

console.log("[deploy-db] applying migrations…");
run("npx --no-install prisma migrate deploy");
console.log("[deploy-db] seeding (idempotent)…");
run("npx --no-install tsx prisma/seed.ts");
console.log("[deploy-db] done (best-effort).");
process.exit(0);
