import { test, expect } from "@playwright/test";
import { login, ACCOUNTS } from "./helpers";

// Routes verified in offline (mock-data) mode. DB-only routes — pipeline detail,
// configurator, estimation, quotations, procurement, manufacturing, testing,
// settings — are exercised by the live-MySQL smoke test, not here.
const routes: { path: string; heading: RegExp }[] = [
  { path: "/projects", heading: /Projects/ },
  { path: "/customers", heading: /Customers/ },
  { path: "/pipeline", heading: /Pipeline/ },
];

// Log in once, then visit each route in one test (one dev-server session).
test("main routes render without a client error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await login(page, ACCOUNTS.admin);

  for (const r of routes) {
    await page.goto(r.path);
    await expect(page.getByRole("heading", { name: r.heading }).first()).toBeVisible();
  }

  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("an unknown project id renders the not-found page", async ({ page }) => {
  await login(page, ACCOUNTS.admin);
  await page.goto("/projects/PRJ-DOES-NOT-EXIST");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});
