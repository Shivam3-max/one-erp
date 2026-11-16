import { test, expect } from "@playwright/test";
import { login, ACCOUNTS } from "./helpers";

test("admin can sign in and reach the dashboard", async ({ page }) => {
  await login(page, ACCOUNTS.admin);
  await expect(page.getByText("Order Book", { exact: true })).toBeVisible();
});

test("viewer can sign in and reach the dashboard", async ({ page }) => {
  await login(page, ACCOUNTS.viewer);
  await expect(page.getByText("Order Book", { exact: true })).toBeVisible();
});

test("a signed-in user can sign out", async ({ page }) => {
  await login(page, ACCOUNTS.admin);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
});
