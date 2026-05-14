import { expect, test } from "@playwright/test";

test("public platform routes expose the core workflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /therapy matching/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /start intake/i })).toBeVisible();

  await page.goto("/client");
  await expect(page.getByRole("heading", { name: /care room/i })).toBeVisible();

  await page.goto("/provider");
  await expect(page.getByRole("heading", { name: /clinical queue/i })).toBeVisible();

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: /operations, compliance/i })).toBeVisible();
});
