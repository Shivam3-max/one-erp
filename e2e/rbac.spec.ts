import { test, expect } from "@playwright/test";
import { login, ACCOUNTS } from "./helpers";

// RBAC is enforced server-side; here we assert the UI reflects it. The New
// Project action lives in the top bar (visible on every authenticated page),
// so this runs in offline mock mode. Settings read-only gating is a DB-backed
// page, covered by the live-MySQL smoke test.

test("admin sees the New Project action", async ({ page }) => {
  await login(page, ACCOUNTS.admin);
  await expect(page.getByRole("button", { name: "New Project" })).toBeVisible();
});

test("viewer does NOT see the New Project action", async ({ page }) => {
  await login(page, ACCOUNTS.viewer);
  await expect(page.getByRole("button", { name: "New Project" })).toHaveCount(0);
});

test("manager sees the New Project action", async ({ page }) => {
  await login(page, ACCOUNTS.manager);
  await expect(page.getByRole("button", { name: "New Project" })).toBeVisible();
});
