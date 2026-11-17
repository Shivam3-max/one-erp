// After `next build` with output:"standalone", Next emits a self-contained
// server at .next/standalone/server.js but does NOT copy static assets next to
// it. Passenger (Hostinger Node.js hosting) runs that server.js directly, so we
// copy .next/static and public/ into the standalone tree here (postbuild).
import { existsSync, cpSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

if (!existsSync(standalone)) {
  console.log("[standalone-assets] .next/standalone not found — is output:'standalone' set? Skipping.");
  process.exit(0);
}

// .next/static -> .next/standalone/.next/static
const staticSrc = path.join(root, ".next", "static");
if (existsSync(staticSrc)) {
  const dest = path.join(standalone, ".next", "static");
  mkdirSync(path.dirname(dest), { recursive: true });
  cpSync(staticSrc, dest, { recursive: true });
  console.log("[standalone-assets] copied .next/static");
}

// public -> .next/standalone/public (only if the project has a public dir)
const publicSrc = path.join(root, "public");
if (existsSync(publicSrc)) {
  cpSync(publicSrc, path.join(standalone, "public"), { recursive: true });
  console.log("[standalone-assets] copied public/");
}

console.log("[standalone-assets] done.");
