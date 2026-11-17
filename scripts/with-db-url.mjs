// Run a Prisma CLI command with DATABASE_URL composed from DATABASE_URL or the
// discrete DB_* variables (the Hostinger shape). The schema reads
// env("DATABASE_URL"), so the CLI needs it in the environment.
//
//   node scripts/with-db-url.mjs prisma migrate deploy
//   node scripts/with-db-url.mjs tsx prisma/seed.ts
import { execSync } from "node:child_process";
import { resolveDatabaseUrl } from "../lib/db-url.mjs";

const url = resolveDatabaseUrl();
if (!url) {
  console.error(
    "No database configuration. Set DATABASE_URL, or DB_HOST / DB_NAME / DB_USER (+ DB_PASSWORD).",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/with-db-url.mjs <command>");
  process.exit(1);
}

execSync(args.join(" "), { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
