import { expect, test } from "@playwright/test";

const providerPasscode = process.env.CARDIGAN_PROVIDER_PASSCODE;

test("public platform routes expose the core workflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /therapy matching/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /book secure consult|start consult request/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /provider login/i }).first()).toBeVisible();
  await expect(page.getByText(/test without payment/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: /generic deposit|reserve starter deposit/i })).toHaveAttribute(
    "href",
    /buy\.stripe\.com/,
  );

  await page.goto("/client");
  await expect(page.getByRole("heading", { name: /care room/i })).toBeVisible();

  await page.goto("/provider");
  await expect(page.getByRole("heading", { name: /provider login required/i })).toBeVisible();

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: /operations, compliance/i })).toBeVisible();
});

test("real intake form submits for admin review", async ({ page }, testInfo) => {
  await page.goto("/start");

  await page.getByLabel("Legal name").fill("Playwright Client");
  await page
    .getByLabel("Email")
    .fill(`playwright-${testInfo.project.name.toLowerCase()}@example.test`);

  await page.getByRole("button", { name: /submit for review/i }).click();

  await expect(page.getByText(/booking request received for provider review/i)).toBeVisible();
  await expect(page.locator("form").getByText("Christopher Michael Baird")).toBeVisible();
});

test("client submission appears in the provider workspace", async ({ page }, testInfo) => {
  test.skip(!providerPasscode, "CARDIGAN_PROVIDER_PASSCODE is required for provider workspace e2e.");
  const loginPasscode = providerPasscode ?? "";

  const runId = Date.now();
  const clientName = `Practice Client ${testInfo.project.name} ${runId}`;
  const clientEmail = `practice-${testInfo.project.name.toLowerCase()}-${runId}@example.test`;
  const noteTitle = `Consult prep ${testInfo.project.name} ${runId}`;

  await page.goto("/start");
  await page.getByLabel("Legal name").fill(clientName);
  await page.getByLabel("Email").fill(clientEmail);
  await page.getByLabel("Phone").fill("555-0199");
  await page.getByRole("button", { name: /submit for review/i }).click();
  await expect(page.getByText(/booking request received for provider review/i)).toBeVisible();

  await page.goto("/provider-login");
  await page.getByLabel("Provider email").fill("christopher@cardiganincorporated.com");
  await page.getByLabel("Passcode").fill(loginPasscode);
  await page.getByRole("button", { name: /enter provider workspace/i }).click();

  await expect(page.getByRole("heading", { name: /client request queue/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /provider alerts/i })).toBeVisible();
  await expect(page.getByText(/secure Cardigan update/i).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: clientName })).toBeVisible();

  const clientRequest = page
    .locator("form")
    .filter({ hasText: clientName })
    .filter({ has: page.getByRole("button", { name: /save status/i }) });
  await expect(clientRequest).toHaveCount(1);
  await expect(clientRequest.getByText("555-0199")).toBeVisible();
  await clientRequest.locator('select[name="status"]').selectOption("reviewed");
  await clientRequest.getByPlaceholder("Review note").fill("Ready for consult.");
  await clientRequest.getByRole("button", { name: /save status/i }).click();
  await expect(clientRequest.locator("span").filter({ hasText: "reviewed" })).toBeVisible();

  await page.locator('select[name="clientId"]').selectOption({ label: clientName });
  await page.getByPlaceholder("Note title").fill(noteTitle);
  await page.getByPlaceholder("Provider note").fill("Client request reviewed locally.");
  await page.getByRole("button", { name: /save note/i }).click();
  await expect(page.getByText(noteTitle)).toBeVisible();

  await expect(page.getByRole("heading", { name: /notion company os/i })).toBeVisible();
  await page.getByRole("button", { name: /push to notion/i }).click();
  await expect(page.getByText(/company os records pushed without phi/i)).toBeVisible();

  await page.getByRole("button", { name: /logout/i }).click();
  await expect(page.getByRole("heading", { name: /provider login required/i })).toBeVisible();
});
