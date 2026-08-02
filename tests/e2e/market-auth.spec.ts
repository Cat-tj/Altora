import { expect, test } from "@playwright/test";

const email = "market-owner@test.local";
const password = "isolated-test-password";

test("Market owner can sign in and reach cashier", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Kata sandi" }).fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/simple\/hari-ini$/);
  await page.getByRole("link", { name: "Buka Kasir", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: /Buka shift|Penjualan baru/ })).toBeVisible();
});

test("unauthenticated Market route returns to product login", async ({ page }) => {
  await page.goto("/kasir");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fkasir/);
});

test("mobile Market has navigation and logout controls", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "khusus viewport mobile");
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Kata sandi" }).fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByRole("navigation", { name: "Navigasi cepat Market" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Keluar" })).toBeVisible();
});
