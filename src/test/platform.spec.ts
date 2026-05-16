import { expect, test } from "@playwright/test";

test("public platform routes expose the core workflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /therapy matching/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /start intake/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /reserve starter deposit/i })).toHaveAttribute(
    "href",
    /buy\.stripe\.com/,
  );

  await page.goto("/client");
  await expect(page.getByRole("heading", { name: /care room/i })).toBeVisible();

  await page.goto("/provider");
  await expect(page.getByRole("heading", { name: /clinical queue/i })).toBeVisible();

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

  await expect(page.getByText(/intake received for admin review/i)).toBeVisible();
  await expect(page.locator("form").getByText("Christopher Michael Baird")).toBeVisible();
});
