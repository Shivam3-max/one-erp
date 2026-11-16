import { test, expect } from "@playwright/test";

test.describe("public / unauthenticated", () => {
  test("login page renders the sign-in form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByPlaceholder("you@company.com")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("an unauthenticated app route redirects to /login", async ({ page }) => {
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/login/);
  });

  test("invalid credentials show an error", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@company.com").fill("nobody@example.com");
    await page.getByPlaceholder("••••••••").fill("wrongpass");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Invalid email or password.")).toBeVisible();
  });

  test("security headers are present", async ({ request }) => {
    const res = await request.get("/login");
    const headers = res.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  });

  test("health endpoint responds", async ({ request }) => {
    const res = await request.get("/api/health");
    // 200 if a DB is reachable, 503 if not — both are valid liveness responses.
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty("status");
  });
});
