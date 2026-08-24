import { execSync } from "node:child_process";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node scripts/with-db-url.mjs <command>");
  process.exit(1);
}

const command = args.join(" ");
const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || "file:./prisma/dev.db",
};

execSync(command, {
  stdio: "inherit",
  env,
});
