import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Emit a self-contained server bundle in .next/standalone for small Docker images.
  output: "standalone",
  // Pin the file-tracing root to this project. Without this, a stray lockfile in a
  // parent directory makes Next infer the wrong workspace root and nest the
  // standalone output under the full path.
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
