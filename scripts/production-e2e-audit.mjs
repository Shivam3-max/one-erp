import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.ERP_E2E_BASE_URL || "https://erp.candron.com";
const password = process.env.ERP_E2E_PASSWORD || "candron123";
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = path.resolve("test-results", "production-e2e");
const routes = [
  "/", "/projects", "/pipeline", "/customers", "/configurator",
  "/estimation", "/quotations", "/compliance", "/procurement",
  "/manufacturing", "/testing", "/documents", "/assistant", "/settings",
  "/definitely-not-a-real-route",
];
const roles = [
  { name: "admin", email: "client.admin@candron.in" },
  { name: "manager", email: "vikram@candron.in" },
  { name: "member", email: "priya@candron.in" },
  { name: "viewer", email: "client.viewer@candron.in" },
];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const report = { startedAt: new Date().toISOString(), baseUrl, roles: {}, screenshots: [], findings: [] };

async function login(context, role) {
  const page = await context.newPage();
  const diagnostics = { consoleErrors: [], failedRequests: [] };
  page.on("console", (msg) => {
    if (msg.type() === "error") diagnostics.consoleErrors.push({ url: page.url(), text: msg.text() });
  });
  page.on("pageerror", (error) => diagnostics.consoleErrors.push({ url: page.url(), text: `PAGEERROR: ${error.message}` }));
  page.on("requestfailed", (request) => diagnostics.failedRequests.push({
    url: request.url(), method: request.method(), error: request.failure()?.errorText,
  }));
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(500);
  await page.getByLabel("Email").fill(role.email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: /^Sign in$/ }).click();
  await page.waitForTimeout(4_000);
  if (new URL(page.url()).pathname.startsWith("/login")) {
    const alert = await page.getByRole("alert").allTextContents().catch(() => []);
    throw new Error(`Login remained on ${page.url()}: ${alert.join(" | ") || (await page.locator("body").innerText()).slice(0, 500)}`);
  }
  return { page, diagnostics };
}

async function inspectRoute(page, pathname) {
  const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle", timeout: 30_000 });
  const details = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
    };
    const controls = [...document.querySelectorAll("button, a, input, select, textarea")]
      .filter(visible)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        text: (element.getAttribute("aria-label") || element.textContent || element.getAttribute("placeholder") || "").trim().replace(/\s+/g, " ").slice(0, 120),
        href: element instanceof HTMLAnchorElement ? element.getAttribute("href") : null,
        type: element.getAttribute("type"),
        disabled: "disabled" in element ? element.disabled : false,
      }));
    return {
      title: document.title,
      heading: document.querySelector("h1")?.textContent?.trim() || "",
      bodyText: document.body.innerText.slice(0, 4000),
      controls,
      layout: {
        innerWidth,
        innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
        canScrollX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      },
    };
  });
  return {
    requestedPath: pathname,
    status: response?.status() ?? null,
    finalUrl: page.url(),
    ...details,
    hasErrorBoundary: /something went wrong|application error|internal server error/i.test(details.bodyText),
  };
}

async function exerciseSafeControls(page, roleName) {
  const checks = [];
  const openAndRecord = async (pathname, buttonName, expectedText) => {
    await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
    const button = page.getByRole("button", { name: buttonName }).first();
    const count = await button.count();
    if (!count) return checks.push({ pathname, control: String(buttonName), present: false });
    await button.click();
    const body = await page.locator("body").innerText();
    checks.push({ pathname, control: String(buttonName), present: true, opened: body.includes(expectedText) });
    await page.keyboard.press("Escape").catch(() => {});
  };

  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  const search = page.getByPlaceholder(/Search projects/i);
  if (await search.count()) {
    await search.fill("nonexistent-e2e-search");
    await page.waitForTimeout(300);
    checks.push({ pathname: "/", control: "global search", present: true, body: (await page.locator("body").innerText()).slice(-500) });
    await search.fill("");
  }
  const alerts = page.getByRole("button", { name: /Alerts & activity/i });
  if (await alerts.count()) {
    await alerts.click();
    checks.push({ pathname: "/", control: "alerts", present: true, opened: /activit|alert/i.test(await page.locator("body").innerText()) });
    await page.keyboard.press("Escape");
  }
  const account = page.getByRole("button", { name: /Account settings/i });
  if (await account.count()) {
    await account.click();
    checks.push({ pathname: "/", control: "account settings", present: true, opened: /account|profile|settings/i.test(await page.locator("body").innerText()) });
    await page.keyboard.press("Escape");
  }

  if (roleName !== "viewer") {
    await openAndRecord("/customers", /Add customer/i, "Add customer");
    await openAndRecord("/documents", /Add document/i, "Add document");
    await openAndRecord("/", /New Project/i, "New project");
  }

  await page.goto(`${baseUrl}/settings`, { waitUntil: "networkidle" });
  for (const name of ["Organization", "Product Families", "Workflows", "Rate Cards", "Commercial", "Quotation", "Standards", "Team & Roles"]) {
    const tab = page.getByRole("button", { name, exact: true });
    if (await tab.count()) {
      await tab.click();
      checks.push({ pathname: "/settings", control: name, present: true, selectedContent: (await page.locator("main").innerText()).includes(name) });
    } else checks.push({ pathname: "/settings", control: name, present: false });
  }
  return checks;
}

try {
  for (const role of roles) {
    const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    const roleReport = { login: null, routes: [], controls: [], diagnostics: null };
    try {
      const { page, diagnostics } = await login(context, role);
      roleReport.login = { ok: true, finalUrl: page.url() };
      for (const route of routes) roleReport.routes.push(await inspectRoute(page, route));
      roleReport.controls = await exerciseSafeControls(page, role.name);
      roleReport.diagnostics = diagnostics;
      if (role.name === "admin") {
        for (const pathname of ["/", "/customers", "/documents", "/settings"]) {
          await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
          const file = path.join(outputDir, `admin-${pathname === "/" ? "overview" : pathname.slice(1)}.png`);
          await page.screenshot({ path: file, fullPage: false });
          report.screenshots.push(file);
        }
      }
    } catch (error) {
      roleReport.login ??= { ok: false };
      roleReport.error = error instanceof Error ? error.message : String(error);
    } finally {
      report.roles[role.name] = roleReport;
      await context.close();
    }
  }

  const publicContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const publicPage = await publicContext.newPage();
  const unauthenticated = await publicPage.goto(`${baseUrl}/documents`, { waitUntil: "networkidle" });
  report.unauthenticated = { status: unauthenticated?.status(), finalUrl: publicPage.url(), redirectedToLogin: publicPage.url().includes("/login") };
  const invalid = await publicPage.goto(`${baseUrl}/definitely-not-a-real-route`, { waitUntil: "networkidle" });
  report.invalidRoute = { status: invalid?.status(), finalUrl: publicPage.url() };
  await publicContext.close();
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(path.join(outputDir, "audit.json"), JSON.stringify(report, null, 2));
  await browser.close();
}

console.log(JSON.stringify({ output: path.join(outputDir, "audit.json"), roles: Object.keys(report.roles), finishedAt: report.finishedAt }));
