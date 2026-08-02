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

test("keyboard flow keeps login errors actionable", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("unknown-owner@test.local");
  await page.getByRole("textbox", { name: "Kata sandi" }).fill("wrong-password");
  await page.getByRole("button", { name: "Masuk" }).click();
  const error = page.getByTestId("market-login-error");
  await expect(error).toContainText("Email atau kata sandi salah");
  await expect(error).toBeFocused();
  await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("textbox", { name: "Kata sandi" })).toHaveAttribute("aria-invalid", "true");
});

test("void dialog closes with Escape and returns focus to its trigger", async ({ page }) => {
  const databaseUrl = process.env.DATABASE_URL;
  test.skip(!databaseUrl, "DATABASE_URL diperlukan untuk fixture transaksi void");
  if (!databaseUrl) return;

  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: databaseUrl });
  let fixture: { saleId: string; shiftId: string } | undefined;
  try {
    const owner = (await pool.query(`
      SELECT u.id, u.email, u."tenantId" AS tenant_id
        FROM "User" u
        JOIN "Tenant" t ON t.id = u."tenantId"
       WHERE u.role = 'OWNER' AND u."isActive" = true AND t."isActive" = true
         AND NOT EXISTS (SELECT 1 FROM "CashierShift" cs WHERE cs."tenantId" = u."tenantId" AND cs."userId" = u.id AND cs.status = 'OPEN')
         AND EXISTS (SELECT 1 FROM "Outlet" o WHERE o."tenantId" = u."tenantId" AND o."isActive" = true)
         AND EXISTS (SELECT 1 FROM "Product" p JOIN "ProductStock" ps ON ps."productId" = p.id AND ps."tenantId" = p."tenantId" JOIN "Outlet" o ON o.id = ps."outletId" AND o."tenantId" = ps."tenantId" WHERE p."tenantId" = u."tenantId" AND p.kind = 'GOODS' AND p."isActive" = true AND ps.qty >= 1 AND o."isActive" = true)
       ORDER BY u."createdAt"
       LIMIT 1
    `)).rows[0];
    expect(owner, "fixture owner harus tersedia").toBeTruthy();
    const outlet = (await pool.query(`SELECT o.id FROM "Outlet" o WHERE o."tenantId" = $1 AND o."isActive" = true AND EXISTS (SELECT 1 FROM "Product" p JOIN "ProductStock" ps ON ps."productId" = p.id AND ps."tenantId" = p."tenantId" AND ps."outletId" = o.id WHERE p."tenantId" = o."tenantId" AND p.kind = 'GOODS' AND p."isActive" = true AND ps.qty >= 1) LIMIT 1`, [owner.tenant_id])).rows[0];
    const product = (await pool.query(`SELECT p.id, p.price FROM "Product" p JOIN "ProductStock" ps ON ps."productId" = p.id AND ps."tenantId" = p."tenantId" AND ps."outletId" = $2 WHERE p."tenantId" = $1 AND p."isActive" = true AND p.kind = 'GOODS' AND ps.qty >= 1 LIMIT 1`, [owner.tenant_id, outlet.id])).rows[0];
    const { openMarketShift, createMarketSale } = await import("../../apps/market/lib/market-pos.ts");
    const shift = await openMarketShift({ tenantId: owner.tenant_id, userId: owner.id, role: "OWNER", outletId: outlet.id, openingCash: 0 });
    const sale = await createMarketSale({ tenantId: owner.tenant_id, userId: owner.id, shiftId: shift.id, requestId: crypto.randomUUID(), items: [{ productId: product.id, quantity: 1 }], paymentMethod: "CASH", amountPaid: Number(product.price) });
    fixture = { saleId: sale.id, shiftId: shift.id };
    await page.goto("/kasir/riwayat");
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
    await page.getByLabel("Email").fill(owner.email);
    await page.getByRole("textbox", { name: "Kata sandi" }).fill(password);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/\/kasir\/riwayat$/);
    const cancel = page.getByRole("button", { name: "Batalkan" }).first();
    await cancel.focus();
    await cancel.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(cancel).toBeFocused();
  } finally {
    if (fixture) {
      await pool.query(`DELETE FROM "MarketCheckoutRequest" WHERE "saleId" = $1`, [fixture.saleId]);
      await pool.query(`DELETE FROM "Sale" WHERE id = $1`, [fixture.saleId]);
      await pool.query(`DELETE FROM "CashierShift" WHERE id = $1`, [fixture.shiftId]);
    }
    await pool.end();
  }
});
