import { defineConfig, devices } from "@playwright/test";

const PORT = 3560;
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E runs against `next dev`, which falls back to in-memory mock/seed data when
 * MySQL is unreachable — so these tests need no database. AUTH_SECRET and
 * DATABASE_URL come from .env (both are required for the app to boot).
 */
export default defineConfig({
  testDir: "./e2e",
  // One dev server with the in-memory mock fallback — run serially for stability.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  // `next dev` compiles each route on first hit, so allow generous timeouts.
  timeout: 60_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // E2E logs in repeatedly from one IP; relax the auth rate limits for it.
    env: { SIGNIN_RATE_MAX: "1000", REGISTER_RATE_MAX: "1000" },
  },
});
