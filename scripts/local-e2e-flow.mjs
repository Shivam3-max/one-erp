import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.ERP_E2E_BASE_URL || "http://localhost:3550";
const outputDir = path.resolve("test-results", "local-e2e");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
await mkdir(outputDir, { recursive: true });
const fixturePath = path.join(outputDir, "e2e-document.txt");
await writeFile(fixturePath, "CANDRON OneERP local E2E document fixture\n");
const runId = Date.now().toString().slice(-6);
const customerName = `E2E Test Utilities ${runId}`;
const projectTitle = `E2E Pune Feeder Package ${runId}`;
const documentTitle = `E2E Uploaded Test Document ${runId}`;
const vendorName = `E2E Copper Vendor ${runId}`;

const report = { startedAt: new Date().toISOString(), baseUrl, checks: [], consoleErrors: [], failedRequests: [], screenshots: [] };
const check = (name, ok, detail = "") => report.checks.push({ name, ok: Boolean(ok), detail });
const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, acceptDownloads: true });
const page = await context.newPage();
page.on("console", (message) => { if (message.type() === "error") report.consoleErrors.push({ url: page.url(), text: message.text() }); });
page.on("pageerror", (error) => report.consoleErrors.push({ url: page.url(), text: `PAGEERROR: ${error.message}` }));
page.on("requestfailed", (request) => {
  const error = request.failure()?.errorText || "unknown";
  if (error !== "net::ERR_ABORTED") report.failedRequests.push({ url: request.url(), method: request.method(), error });
});

async function waitSettled() {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);
}

async function shot(name, target = page) {
  const file = path.join(outputDir, `${name}.png`);
  await target.screenshot({ path: file, fullPage: false });
  report.screenshots.push(file);
}

try {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill("client.admin@candron.in");
  await page.locator("#password").fill("candron123");
  await page.getByRole("button", { name: /^Sign in$/ }).click();
  await page.waitForURL(`${baseUrl}/`, { timeout: 15_000 });
  check("Admin login", page.url() === `${baseUrl}/`);

  // Customer creation and required-field behavior.
  await page.goto(`${baseUrl}/customers`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add customer", exact: true }).click();
  const customerDialog = page.getByRole("dialog", { name: "Add customer" });
  check("Add customer dialog opens", await customerDialog.isVisible());
  check("Customer submit disabled when required fields are empty", await customerDialog.getByRole("button", { name: "Add customer" }).isDisabled());
  await customerDialog.getByPlaceholder("Company legal name").fill(customerName);
  await customerDialog.getByLabel(/Customer type/).selectOption("utility");
  await customerDialog.getByLabel(/^City/).fill("Pune");
  await customerDialog.getByLabel(/^State/).fill("Maharashtra");
  await customerDialog.getByLabel(/^Country/).fill("India");
  await customerDialog.getByLabel(/GSTIN/).fill("27ABCDE1234F1Z5");
  await customerDialog.getByLabel(/^Contact name/).fill("E2E Contact");
  await customerDialog.getByLabel(/^Role/).fill("Procurement Manager");
  await customerDialog.getByLabel(/^Email/).fill("e2e.contact@example.com");
  await customerDialog.getByLabel(/^Phone/).fill("9999999999");
  await Promise.all([
    page.waitForURL(/\/customers\/CUS-/, { timeout: 15_000 }),
    customerDialog.getByRole("button", { name: "Add customer" }).click(),
  ]);
  const customerUrl = page.url();
  const customerId = new URL(customerUrl).pathname.split("/").pop();
  check("Customer created and detail page opened", Boolean(customerId), customerId);
  check("Customer detail shows company", await page.getByText(customerName, { exact: false }).first().isVisible());

  // Communication and customer commercial terms.
  await page.getByRole("button", { name: "Log", exact: true }).click();
  const commDialog = page.getByRole("dialog", { name: "Log communication" });
  check("Communication dialog opens", await commDialog.isVisible());
  await commDialog.getByPlaceholder(/Delivery schedule/).fill("E2E delivery discussion");
  await commDialog.getByPlaceholder(/What was discussed/).fill("Confirmed the local E2E test workflow.");
  await commDialog.getByRole("button", { name: "Log entry" }).click();
  await page.getByText("E2E delivery discussion", { exact: false }).waitFor({ timeout: 10_000 });
  check("Communication entry saved", true);
  await page.getByPlaceholder(/tender penalty clauses/).fill("E2E commercial note");
  await page.getByRole("button", { name: "Save terms" }).click();
  await page.getByRole("button", { name: "Saved" }).waitFor({ timeout: 10_000 });
  check("Customer commercial terms saved", true);
  await shot("customer-detail");

  // Project creation.
  await page.getByRole("button", { name: "New Project" }).click();
  const projectDialog = page.getByRole("dialog", { name: "New Project" });
  check("New project dialog opens", await projectDialog.isVisible());
  check("Project submit disabled before title", await projectDialog.getByRole("button", { name: "Create project" }).isDisabled());
  await projectDialog.getByPlaceholder(/Pune Feeder Package/).fill(projectTitle);
  await projectDialog.locator("select").first().selectOption({ label: customerName });
  await projectDialog.getByPlaceholder(/Power Transformers/).fill("2 × 5 MVA 33/11 kV Power Transformers");
  await projectDialog.getByPlaceholder("City, State").fill("Pune, Maharashtra");
  await projectDialog.getByPlaceholder("0.0").fill("4.5");
  await Promise.all([
    page.waitForURL(/\/projects\/PRJ-/, { timeout: 15_000 }),
    projectDialog.getByRole("button", { name: "Create project" }).click(),
  ]);
  const projectId = new URL(page.url()).pathname.split("/").pop();
  check("Project created and detail page opened", Boolean(projectId), projectId);
  check("Project detail shows title", await page.getByText(projectTitle, { exact: false }).first().isVisible());
  let stagesAdvanced = 0;
  for (let index = 0; index < 5; index++) {
    const advance = page.getByRole("button", { name: /Advance/ });
    if (!(await advance.count())) break;
    const before = await page.locator("main").innerText();
    await advance.click();
    await page.waitForTimeout(800);
    await page.reload({ waitUntil: "networkidle" });
    if ((await page.locator("main").innerText()) !== before) stagesAdvanced++;
  }
  check("Project lifecycle advances through Estimation", stagesAdvanced === 5, String(stagesAdvanced));
  await shot("project-detail");

  // Configuration and estimate save flows.
  await page.goto(`${baseUrl}/configurator`, { waitUntil: "networkidle" });
  const saveConfig = page.getByRole("button", { name: "Save to project" });
  check("Configurator save control enabled", await saveConfig.isEnabled());
  await saveConfig.click();
  await page.locator("select").filter({ has: page.locator(`option[value="${projectId}"]`) }).selectOption(projectId);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByText(new RegExp(`Saved to ${projectId}`)).waitFor({ timeout: 10_000 });
  check("Configuration saved to project", true);

  await page.goto(`${baseUrl}/estimation`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Save estimate to project" }).click();
  await page.locator("select").filter({ has: page.locator(`option[value="${projectId}"]`) }).selectOption(projectId);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByText(new RegExp(`Saved to ${projectId}`)).waitFor({ timeout: 10_000 });
  check("Estimate saved to project", true);

  // Quotation creation.
  await page.goto(`${baseUrl}/quotations`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "New quotation" }).click();
  check("Quotation generation dialog opens", await page.getByRole("heading", { name: "Generate quotation" }).isVisible());
  await page.locator("select").filter({ has: page.locator(`option[value="${projectId}"]`) }).selectOption(projectId);
  await Promise.all([
    page.waitForURL(new RegExp(`/quotations/${projectId}$`), { timeout: 15_000 }),
    page.getByRole("button", { name: "Generate quotation" }).last().click(),
  ]);
  check("Quotation generated and opened", page.url().endsWith(`/quotations/${projectId}`));
  await shot("quotation-detail");

  // Procurement vendor creation.
  await page.goto(`${baseUrl}/procurement`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add vendor" }).click();
  await page.getByPlaceholder("Vendor name").fill(vendorName);
  await page.getByPlaceholder("Category").fill("Copper");
  await page.getByPlaceholder("Location").fill("Pune");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByText(vendorName, { exact: false }).waitFor({ timeout: 10_000 });
  check("Procurement vendor added", true);

  // Uploaded document and authenticated download.
  await page.goto(`${baseUrl}/documents`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add document" }).click();
  const documentDialog = page.getByRole("dialog", { name: "Add document" });
  check("Add document dialog opens with a project available", await documentDialog.isVisible() && !(await documentDialog.getByText("Create a project first").count()));
  await documentDialog.locator('input[type="file"]').setInputFiles(fixturePath);
  await documentDialog.getByPlaceholder(/Approved customer drawing/).fill(documentTitle);
  await documentDialog.getByLabel(/^Category/).selectOption("Engineering");
  await documentDialog.getByRole("button", { name: "Upload document" }).click();
  await page.getByText(documentTitle, { exact: true }).waitFor({ timeout: 15_000 });
  check("Document uploaded and listed", true);
  const downloadLink = page.getByRole("link", { name: new RegExp(`Download ${documentTitle}`) });
  const downloadResponse = await context.request.get(new URL(await downloadLink.getAttribute("href"), baseUrl).href);
  check("Authenticated document download works", downloadResponse.ok() && (await downloadResponse.text()).includes("local E2E document fixture"), String(downloadResponse.status()));
  await shot("documents-populated");

  // Global search and populated project filtering.
  await page.getByLabel("Search", { exact: true }).fill(projectTitle);
  await page.getByLabel("Search", { exact: true }).press("Enter");
  await page.waitForURL(/\/projects\?q=/);
  check("Global search navigates with query", new URL(page.url()).searchParams.get("q") === projectTitle);
  check("Project search result is visible", await page.getByText(projectTitle, { exact: false }).first().isVisible());

  // Viewer permission checks using an isolated authenticated session.
  const viewerContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const viewerPage = await viewerContext.newPage();
  await viewerPage.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await viewerPage.getByLabel("Email").fill("client.viewer@candron.in");
  await viewerPage.locator("#password").fill("candron123");
  await viewerPage.getByRole("button", { name: /^Sign in$/ }).click();
  await viewerPage.waitForURL(`${baseUrl}/`, { timeout: 15_000 });
  check("Viewer login", true);
  check("Viewer cannot see New Project", !(await viewerPage.getByRole("button", { name: "New Project" }).count()));
  await viewerPage.goto(`${baseUrl}/customers`, { waitUntil: "networkidle" });
  check("Viewer cannot see Add customer", !(await viewerPage.getByRole("button", { name: "Add customer" }).count()));
  await viewerPage.goto(`${baseUrl}/documents`, { waitUntil: "networkidle" });
  check("Viewer cannot see Add document", !(await viewerPage.getByRole("button", { name: "Add document" }).count()));
  await viewerPage.goto(`${baseUrl}/settings`, { waitUntil: "networkidle" });
  const viewerSettingsFieldset = viewerPage.locator("fieldset");
  check("Viewer settings are read-only", await viewerSettingsFieldset.getAttribute("disabled") !== null && await viewerPage.getByText(/read-only access/i).isVisible());
  await viewerContext.close();

  // Mobile visual and viewport-fit pass using the admin session.
  const storageState = await context.storageState();
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState });
  const mobilePage = await mobileContext.newPage();
  for (const route of ["/", "/customers", "/documents", `/projects/${projectId}`]) {
    await mobilePage.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    const fit = await mobilePage.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      heading: document.querySelector("h1")?.textContent?.trim() || "",
    }));
    check(`Mobile viewport fit ${route}`, fit.scrollWidth <= fit.clientWidth, JSON.stringify(fit));
    await shot(`mobile-${route === "/" ? "overview" : route.replaceAll("/", "-").replace(/^-/, "")}`, mobilePage);
  }
  await mobileContext.close();
} catch (error) {
  report.fatalError = error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error);
} finally {
  report.finishedAt = new Date().toISOString();
  report.summary = {
    passed: report.checks.filter((item) => item.ok).length,
    failed: report.checks.filter((item) => !item.ok).length,
  };
  await writeFile(path.join(outputDir, "audit.json"), JSON.stringify(report, null, 2));
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
}

console.log(JSON.stringify({ summary: report.summary, fatalError: report.fatalError || null, output: path.join(outputDir, "audit.json") }));
