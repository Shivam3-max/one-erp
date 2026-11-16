import { expect, type Page } from "@playwright/test";

/** Demo accounts seeded in dev (password: candron123). */
export const ACCOUNTS = {
  admin: "meera@candron.in",
  viewer: "viewer@candron.in",
  manager: "vikram@candron.in",
} as const;

export async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByPlaceholder("you@company.com").fill(email);
  await page.getByPlaceholder("••••••••").fill("candron123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
}
