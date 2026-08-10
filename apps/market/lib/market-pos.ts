import { randomUUID } from "node:crypto";
import { normalizeCheckoutRequestId, normalizeRetailCart, validateRetailPayment } from "@altora/pos-core";
import { db } from "./db";
import { InsufficientStockError, applyStockMovement } from "./market-stock-ledger";
import { computeBestPromoDiscount, type PromoCartLine } from "./promo-calc";
import type { MarketRole } from "./market-user";

type AccessibleUser = { tenantId: string; userId: string; role: MarketRole };
export type PaymentMethod = "CASH" | "QRIS" | "TRANSFER" | "EWALLET" | "DEPOSIT" | "GIFT_CARD";
const CASH_VARIANCE_THRESHOLD = 10_000;
const MAX_AUDIT_NOTE_LENGTH = 500;
const POINTS_PER_THOUSAND = 1; // 1 poin per Rp1.000

export type MarketOutlet = { id: string; name: string; suggestedOpeningCash: number | null };
export type OpenMarketShift = { id: string; outletId: string; outletName: string; openingCash: number; openedAt: Date };
export type MarketVariantGroup = {
  id: string;
  name: string;
  type: "SINGLE" | "MULTIPLE";
  required: boolean;
  options: { id: string; name: string; priceDelta: number }[];
};
export type MarketPosProduct = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  trackStock: boolean;
  trackExpiry: boolean;
  expiredAt: string | null;
  variantGroups: MarketVariantGroup[];
  categoryId: string | null;
  categoryName: string | null;
};
export type MarketCartLine = {
  productId: string;
  quantity: number;
  variantOptionIds?: string[];
  variantLabel?: string | null;
  unitPrice?: number;
  /** Diskon manual per item (Rp), divalidasi server. */
  discountAmount?: number;
};
export type MarketSale = { id: string; invoiceNumber: string; outletName: string; cashierName: string; total: number; paymentMethod: PaymentMethod; amountPaid: number; changeAmount: number; status: "COMPLETED" | "VOIDED"; voidReason: string | null; createdAt: Date; items: { id: string; productName: string; price: number; qty: number; subtotal: number }[] };
export type MarketShiftSummary = { shift: OpenMarketShift; cashSales: number; cashTransactions: number; digitalSales: number; digitalTransactions: number; expectedCash: number; paymentBreakdown: { method: string; total: number; count: number }[] };

function outletScope(role: MarketRole) {
  return role === "OWNER"
    ? `o."tenantId" = $1 AND $2::text IS NOT NULL`
    : `o."tenantId" = $1 AND EXISTS (SELECT 1 FROM "UserOutlet" uo WHERE uo."outletId" = o.id AND uo."userId" = $2 AND uo."tenantId" = $1)`;
}

export async function listAccessibleMarketOutlets({ tenantId, userId, role }: AccessibleUser): Promise<MarketOutlet[]> {
  const result = await db.query<{ id: string; name: string; suggested_opening_cash: string | null }>(
    `SELECT o.id, o.name,
            (SELECT cs."closingCash"::text FROM "CashierShift" cs
              WHERE cs."tenantId" = o."tenantId" AND cs."outletId" = o.id
                AND cs.status = 'CLOSED' AND cs."closingCash" IS NOT NULL
              ORDER BY cs."closedAt" DESC LIMIT 1) AS suggested_opening_cash
       FROM "Outlet" o
      WHERE ${outletScope(role)} AND o."isActive" = true
      ORDER BY o.name`,
    [tenantId, userId],
  );
  return result.rows.map((row) => ({ id: row.id, name: row.name, suggestedOpeningCash: row.suggested_opening_cash === null ? null : Number(row.suggested_opening_cash) }));
}

export async function getOpenMarketShift({ tenantId, userId }: Pick<AccessibleUser, "tenantId" | "userId">): Promise<OpenMarketShift | null> {
  const result = await db.query<{ id: string; outlet_id: string; outlet_name: string; opening_cash: string; opened_at: Date }>(
    `SELECT cs.id, cs."outletId" AS outlet_id, o.name AS outlet_name, cs."openingCash"::text AS opening_cash, cs."openedAt" AS opened_at
       FROM "CashierShift" cs
       INNER JOIN "Outlet" o ON o.id = cs."outletId" AND o."tenantId" = cs."tenantId"
      WHERE cs."tenantId" = $1 AND cs."userId" = $2 AND cs.status = 'OPEN'
      ORDER BY cs."openedAt" DESC LIMIT 1`,
    [tenantId, userId],
  );
  const row = result.rows[0];
  return row ? { id: row.id, outletId: row.outlet_id, outletName: row.outlet_name, openingCash: Number(row.opening_cash), openedAt: row.opened_at } : null;
}

export async function openMarketShift(input: AccessibleUser & { outletId: string; openingCash: number }) {
  if (!Number.isSafeInteger(input.openingCash) || input.openingCash < 0) throw new Error("Modal awal tidak valid.");
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`market-shift:${input.tenantId}:${input.userId}`]);
    const outlet = await client.query<{ id: string }>(
      `SELECT o.id FROM "Outlet" o WHERE o.id = $3 AND ${outletScope(input.role)} AND o."isActive" = true`,
      [input.tenantId, input.userId, input.outletId],
    );
    if (!outlet.rows[0]) throw new Error("Outlet tidak tersedia untuk akun ini.");
    const existing = await client.query(`SELECT id FROM "CashierShift" WHERE "tenantId" = $1 AND "userId" = $2 AND status = 'OPEN' LIMIT 1`, [input.tenantId, input.userId]);
    if (existing.rows[0]) throw new Error("Kamu masih punya shift yang terbuka.");
    const created = await client.query<{ id: string }>(
      `INSERT INTO "CashierShift" (id, "tenantId", "outletId", "userId", "openingCash", status, "openedAt") VALUES ($1, $2, $3, $4, $5, 'OPEN', NOW()) RETURNING id`,
      [randomUUID(), input.tenantId, input.outletId, input.userId, input.openingCash],
    );
    await client.query("COMMIT");
    return created.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listMarketPosProducts({ tenantId, outletId }: { tenantId: string; outletId: string }): Promise<MarketPosProduct[]> {
  const result = await db.query<{ id: string; name: string; sku: string | null; price: string; stock: string; track_stock: boolean; track_expiry: boolean; expired_at: Date | null; category_id: string | null; category_name: string | null }>(
    `SELECT p.id, p.name, p.sku, p.price::text, COALESCE(ps.qty, 0)::text AS stock, p."trackStock" AS track_stock, COALESCE(p."trackExpiry", false) AS track_expiry, p."expiredAt" AS expired_at, p."categoryId" AS category_id, c.name AS category_name
       FROM "Product" p
       LEFT JOIN "Category" c ON c.id = p."categoryId" AND c."tenantId" = p."tenantId"
       LEFT JOIN "ProductStock" ps ON ps."productId" = p.id AND ps."outletId" = $2 AND ps."tenantId" = p."tenantId"
      WHERE p."tenantId" = $1 AND p."isActive" = true AND p.kind = 'GOODS'
      ORDER BY p.name`,
    [tenantId, outletId],
  );
  if (result.rows.length === 0) return [];

  const variantResult = await db.query<{ product_id: string; group_id: string; group_name: string; group_type: string; group_required: boolean; option_id: string; option_name: string; option_delta: string }>(
    `SELECT g."productId" AS product_id, g.id AS group_id, g.name AS group_name, g.type AS group_type, g.required AS group_required,
            o.id AS option_id, o.name AS option_name, o."priceDelta"::text AS option_delta
       FROM "ProductVariantGroup" g
       LEFT JOIN "ProductVariantOption" o ON o."variantGroupId" = g.id
      WHERE g."tenantId" = $1 AND g."productId" = ANY($2::text[])
      ORDER BY g."sortOrder", o."sortOrder"`,
    [tenantId, result.rows.map((row) => row.id)],
  );

  const groupsByProduct = new Map<string, Map<string, MarketVariantGroup>>();
  for (const v of variantResult.rows) {
    if (!groupsByProduct.has(v.product_id)) groupsByProduct.set(v.product_id, new Map());
    const groups = groupsByProduct.get(v.product_id)!;
    let group = groups.get(v.group_id);
    if (!group) {
      group = { id: v.group_id, name: v.group_name, type: v.group_type as "SINGLE" | "MULTIPLE", required: v.group_required, options: [] };
      groups.set(v.group_id, group);
    }
    if (v.option_id) group.options.push({ id: v.option_id, name: v.option_name, priceDelta: Number(v.option_delta) });
  }

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    price: Number(row.price),
    stock: Number(row.stock),
    trackStock: row.track_stock,
    trackExpiry: row.track_expiry,
    expiredAt: row.expired_at ? new Date(row.expired_at).toISOString() : null,
    variantGroups: Array.from(groupsByProduct.get(row.id)?.values() ?? []),
    categoryId: row.category_id ?? null,
    categoryName: row.category_name ?? null,
  }));
}

export async function createMarketSale(input: Pick<AccessibleUser, "tenantId" | "userId"> & {
  shiftId: string;
  requestId: string;
  items: MarketCartLine[];
  paymentMethod?: PaymentMethod;
  amountPaid?: number;
  payments?: { method: PaymentMethod; amount: number }[];
  memberId?: string;
  /** Diskon manual transaksi (Rp), divalidasi server. */
  cartDiscount?: number;
}) {
  const normalizedBase = normalizeRetailCart(input.items);
  const items: MarketCartLine[] = input.items.map((item, index) => ({
    productId: item.productId,
    quantity: normalizedBase[index]?.quantity ?? item.quantity,
    variantOptionIds: item.variantOptionIds,
    discountAmount: item.discountAmount,
  }));
  const requestId = normalizeCheckoutRequestId(input.requestId);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`market-checkout:${input.tenantId}:${requestId}`]);
    const existingRequest = await client.query<{ sale_id: string }>(
      `SELECT "saleId" AS sale_id FROM "MarketCheckoutRequest" WHERE "tenantId" = $1 AND "requestId" = $2 LIMIT 1`,
      [input.tenantId, requestId],
    );
    if (existingRequest.rows[0]) {
      const sale = await client.query<{ id: string; invoice_number: string; total: string; change_amount: string }>(
        `SELECT id, "invoiceNumber" AS invoice_number, total::text, "changeAmount"::text FROM "Sale" WHERE id = $1 AND "tenantId" = $2 LIMIT 1`,
        [existingRequest.rows[0].sale_id, input.tenantId],
      );
      if (!sale.rows[0]) throw new Error("Referensi checkout sebelumnya tidak konsisten. Hubungi admin.");
      await client.query("COMMIT");
      return { id: sale.rows[0].id, invoiceNumber: sale.rows[0].invoice_number, total: Number(sale.rows[0].total), change: Number(sale.rows[0].change_amount), reused: true };
    }
    const shiftResult = await client.query<{ id: string; outlet_id: string }>(
      `SELECT id, "outletId" AS outlet_id FROM "CashierShift" WHERE id = $1 AND "tenantId" = $2 AND "userId" = $3 AND status = 'OPEN' FOR UPDATE`,
      [input.shiftId, input.tenantId, input.userId],
    );
    const shift = shiftResult.rows[0];
    if (!shift) throw new Error("Shift aktif tidak ditemukan. Muat ulang halaman.");
    const productIds = items.map((item) => item.productId);
    const products = await client.query<{ id: string; name: string; price: string; track_stock: boolean; category_id: string | null }>(
      `SELECT p.id, p.name, p.price::text, p."trackStock" AS track_stock, p."categoryId" AS category_id
         FROM "Product" p
        WHERE p."tenantId" = $1 AND p.id = ANY($2::text[]) AND p."isActive" = true AND p.kind = 'GOODS'
        FOR UPDATE`,
      [input.tenantId, productIds],
    );
    if (products.rows.length !== items.length) throw new Error("Salah satu produk sudah tidak tersedia. Muat ulang katalog.");
    const trackedProductIds = products.rows.filter((product) => product.track_stock).map((product) => product.id);
    const stockResult = trackedProductIds.length
      ? await client.query<{ product_id: string; qty: string }>(
          `SELECT "productId" AS product_id, qty::text FROM "ProductStock"
            WHERE "tenantId" = $1 AND "outletId" = $2 AND "productId" = ANY($3::text[]) FOR UPDATE`,
          [input.tenantId, shift.outlet_id, trackedProductIds],
        )
      : { rows: [] as { product_id: string; qty: string }[] };
    const stockByProduct = new Map(stockResult.rows.map((stock) => [stock.product_id, Number(stock.qty)]));
    const productById = new Map(products.rows.map((product) => [product.id, product]));

    // ── Resolusi varian: opsi wajib milik tenant & produk yang sama ──
    const linesWithVariants = items.filter((item) => item.variantOptionIds && item.variantOptionIds.length > 0);
    const variantById = new Map<string, { option_name: string; delta: number; product_id: string }>();
    if (linesWithVariants.length > 0) {
      const allOptionIds = Array.from(new Set(linesWithVariants.flatMap((item) => item.variantOptionIds!)));
      const variantRows = await client.query<{ option_id: string; option_name: string; delta: string; product_id: string }>(
        `SELECT o.id AS option_id, o.name AS option_name, o."priceDelta"::text AS delta, g."productId" AS product_id
           FROM "ProductVariantOption" o
           INNER JOIN "ProductVariantGroup" g ON g.id = o."variantGroupId" AND g."tenantId" = $1
          WHERE o."tenantId" = $1 AND o.id = ANY($2::text[])
          FOR UPDATE`,
        [input.tenantId, allOptionIds],
      );
      for (const row of variantRows.rows) variantById.set(row.option_id, { option_name: row.option_name, delta: Number(row.delta), product_id: row.product_id });
      for (const item of linesWithVariants) {
        for (const optionId of item.variantOptionIds!) {
          const variant = variantById.get(optionId);
          if (!variant) throw new Error("Opsi varian tidak tersedia. Muat ulang katalog.");
          if (variant.product_id !== item.productId) throw new Error("Opsi varian tidak cocok dengan produk yang dipilih.");
        }
      }
    }

    const saleItems = items.map((item) => {
      const product = productById.get(item.productId);
      if (!product) throw new Error("Produk tidak ditemukan.");
      if (product.track_stock && (stockByProduct.get(item.productId) ?? 0) < item.quantity) throw new Error(`Stok ${product.name} tidak cukup.`);
      const optionIds = item.variantOptionIds ?? [];
      const variantPriceDelta = optionIds.reduce((sum, optionId) => sum + (variantById.get(optionId)?.delta ?? 0), 0);
      const variantLabel = optionIds.length > 0 ? optionIds.map((optionId) => variantById.get(optionId)?.option_name ?? "").join(" + ") : null;
      const price = Number(product.price) + variantPriceDelta;
      const lineDiscount = Math.min(Math.max(0, item.discountAmount ?? 0), price * item.quantity);
      return { ...item, name: product.name, price, variantPriceDelta, variantLabel, subtotal: price * item.quantity - lineDiscount, lineDiscount, trackStock: product.track_stock, categoryId: product.category_id };
    });
    // Diskonto manual transaksi — dibatasi maksimum subtotal.
    const rawCartDiscount = Math.max(0, Math.floor(input.cartDiscount ?? 0));
    const subtotalAfterLines = saleItems.reduce((total, item) => total + item.subtotal, 0);
    const cartDiscount = Math.min(rawCartDiscount, subtotalAfterLines);
    const subtotal = subtotalAfterLines - cartDiscount;

    // ── Promo: server adalah sumber kebenaran (jangan percaya hitungan client) ──
    // Ambil promo aktif tenant, hitung diskon terbaik (BOGO/DISCOUNT/BULK),
    // lalu kurangi dari subtotal. Hasilnya dicatat di Sale + promotionSnapshot.
    const promoRows = await client.query<{
      id: string; name: string; rule_type: string | null;
      discount_percent: number | null; discount_amount: number | null; min_purchase: number;
      qualifying_qty: number | null; reward_qty: number | null;
      qualifying_product_id: string | null; qualifying_category_id: string | null;
      reward_product_id: string | null; reward_category_id: string | null;
      reward_discount_percent: number | null; max_reward_qty: number | null;
    }>(
      `SELECT id, name, "ruleType"::text AS rule_type,
              "discountPercent" AS discount_percent, "discountAmount" AS discount_amount,
              COALESCE("minPurchase", 0) AS min_purchase,
              "qualifyingQty" AS qualifying_qty, "rewardQty" AS reward_qty,
              "qualifyingProductId" AS qualifying_product_id, "qualifyingCategoryId" AS qualifying_category_id,
              "rewardProductId" AS reward_product_id, "rewardCategoryId" AS reward_category_id,
              "rewardDiscountPercent" AS reward_discount_percent, "maxRewardQty" AS max_reward_qty
         FROM "Promo"
        WHERE "tenantId" = $1 AND "isActive" = true AND "archivedAt" IS NULL`,
      [input.tenantId],
    );
    const promoCart: PromoCartLine[] = saleItems.map((item) => ({
      productId: item.productId,
      categoryId: item.categoryId ?? null,
      lineTotal: item.subtotal,
      price: item.price,
      qty: item.quantity,
      name: item.name,
    }));
    const promoResult = computeBestPromoDiscount(
      promoRows.rows.map((p) => ({
        id: p.id,
        name: p.name,
        ruleType: p.rule_type,
        discountPercent: p.discount_percent,
        discountAmount: p.discount_amount,
        minPurchase: p.min_purchase,
        qualifyingQty: p.qualifying_qty,
        rewardQty: p.reward_qty,
        qualifyingProductId: p.qualifying_product_id,
        qualifyingCategoryId: p.qualifying_category_id,
        rewardProductId: p.reward_product_id,
        rewardCategoryId: p.reward_category_id,
        rewardDiscountPercent: p.reward_discount_percent,
        maxRewardQty: p.max_reward_qty,
      })),
      promoCart,
      subtotal,
    );
    const promoDiscount = promoResult?.discountAmount ?? 0;
    const total = Math.max(0, subtotal - promoDiscount);
    if (total <= 0) throw new Error("Total transaksi tidak boleh nol. Periksa kembali diskon yang diberikan.");
    const promotionSnapshot = promoResult
      ? JSON.stringify({ promoId: promoResult.promoId, promoName: promoResult.promoName, discountAmount: promoResult.discountAmount, label: promoResult.label, appliedLines: promoResult.appliedLines })
      : null;

    // ── Pembayaran: split (payments[]) atau tunggal (backward compat) ──
    const payments: { method: PaymentMethod; amount: number }[] = input.payments && input.payments.length > 0
      ? input.payments
      : [{ method: input.paymentMethod!, amount: input.amountPaid! }];
    const isSplit = payments.length > 1;
    let change = 0;
    if (isSplit) {
      const sum = payments.reduce((total, p) => total + p.amount, 0);
      if (sum !== total) throw new Error("Jumlah pembayaran harus sama persis dengan total transaksi.");
      for (const p of payments) {
        if (!Number.isSafeInteger(p.amount) || p.amount <= 0) throw new Error("Nominal pembayaran tidak valid.");
      }
    } else {
      const method = payments[0]!.method;
      const amount = payments[0]!.amount;
      if (method === "DEPOSIT" || method === "GIFT_CARD") {
        // Saldo/nilai non-tunai: harus sama persis, tanpa kembalian.
        if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Nominal pembayaran tidak valid.");
        if (amount !== total) throw new Error("Jumlah pembayaran non-tunai harus sama persis dengan total tagihan.");
      } else {
        const single = validateRetailPayment({ method, total, amountPaid: amount });
        change = single.change;
      }
    }
    const depositAmount = payments.filter((p) => p.method === "DEPOSIT").reduce((sum, p) => sum + p.amount, 0);

    // ── Member: lock row (tenant-scoped), validasi deposit, poin ──
    let member: { id: string; name: string } | null = null;
    let pointsEarned = 0;
    if (input.memberId) {
      const memberRows = await client.query<{ id: string; name: string; balance: string; points: string }>(
        `SELECT id, name, "depositBalance"::text AS balance, points::text AS points
           FROM "Member" WHERE id = $1 AND "tenantId" = $2 FOR UPDATE`,
        [input.memberId, input.tenantId],
      );
      const row = memberRows.rows[0];
      if (!row) throw new Error("Member tidak ditemukan untuk toko ini.");
      member = { id: row.id, name: row.name };
      if (depositAmount > 0 && Number(row.balance) < depositAmount) {
        throw new Error(`Saldo deposit ${row.name} tidak cukup (tersedia Rp${Number(row.balance).toLocaleString("id-ID")}).`);
      }
      pointsEarned = Math.floor(subtotal / 1000) * POINTS_PER_THOUSAND;
    } else if (depositAmount > 0) {
      throw new Error("Pembayaran deposit membutuhkan member dipilih.");
    }

    const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`market-invoice:${day}`]);
    const sequence = await client.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM "Sale" WHERE "invoiceNumber" LIKE $1`, [`MKT-${day}-%`]);
    const invoiceNumber = `MKT-${day}-${String(Number(sequence.rows[0]?.count ?? 0) + 1).padStart(4, "0")}`;
    const saleId = randomUUID();
    const totalLineDiscounts = saleItems.reduce((sum, item) => sum + item.lineDiscount, 0);
    const totalDiscount = totalLineDiscounts + cartDiscount + promoDiscount;
    await client.query(
      `INSERT INTO "Sale" (id, "tenantId", "outletId", "shiftId", "cashierId", "invoiceNumber", subtotal, "discountAmount", "taxAmount", total, "paymentMethod", "amountPaid", "changeAmount", status, "memberId", "promotionSnapshot", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10::"PaymentMethod", $11, $12, 'COMPLETED', $13, $14::jsonb, NOW(), NOW())`,
      [saleId, input.tenantId, shift.outlet_id, input.shiftId, input.userId, invoiceNumber, subtotal, totalDiscount, total, payments[0]!.method, payments.reduce((sum, p) => sum + p.amount, 0), change, member?.id ?? null, promotionSnapshot],
    );
    for (const item of saleItems) {
      await client.query(
        `INSERT INTO "SaleItem" (id, "tenantId", "saleId", "productId", "productName", price, qty, "discountAmount", subtotal, "variantLabel", "variantPriceDelta")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [randomUUID(), input.tenantId, saleId, item.productId, item.name, item.price, item.quantity, item.lineDiscount, item.subtotal, item.variantLabel, item.variantPriceDelta],
      );
      if (item.trackStock) {
        try {
          await applyStockMovement(client, {
            tenantId: input.tenantId,
            outletId: shift.outlet_id,
            productId: item.productId,
            delta: -item.quantity,
            source: "SALE",
            sourceId: saleId,
            idempotencyKey: `sale:${saleId}:${item.productId}`,
          });
        } catch (error) {
          if (error instanceof InsufficientStockError) {
            throw new Error(`Stok ${item.name} berubah. Muat ulang katalog lalu ulangi transaksi.`);
          }
          throw error;
        }
      }
    }
    if (isSplit) {
      for (const p of payments) {
        await client.query(
          `INSERT INTO "SalePayment" (id, "tenantId", "saleId", method, amount) VALUES ($1, $2, $3, $4::"PaymentMethod", $5)`,
          [randomUUID(), input.tenantId, saleId, p.method, p.amount],
        );
      }
    }
    if (depositAmount > 0 && member) {
      const deducted = await client.query(
        `UPDATE "Member" SET "depositBalance" = "depositBalance" - $3, "updatedAt" = NOW()
          WHERE id = $1 AND "tenantId" = $2 AND "depositBalance" >= $3 RETURNING id`,
        [member.id, input.tenantId, depositAmount],
      );
      if (!deducted.rows[0]) throw new Error("Saldo deposit berubah saat transaksi. Coba lagi.");
      await client.query(
        `INSERT INTO "AuditLog" (id, "tenantId", "userId", action, description) VALUES ($1, $2, $3, 'MEMBER_DEPOSIT_DEBIT', $4)`,
        [randomUUID(), input.tenantId, input.userId, `Deposit ${member.name} dipakai Rp${depositAmount.toLocaleString("id-ID")} (${invoiceNumber})`],
      );
    }
    if (pointsEarned > 0 && member) {
      await client.query(
        `UPDATE "Member" SET points = points + $3, "updatedAt" = NOW() WHERE id = $1 AND "tenantId" = $2 RETURNING id`,
        [member.id, input.tenantId, pointsEarned],
      );
      await client.query(
        `INSERT INTO "PointTransaction" (id, "tenantId", "memberId", type, points, "saleId", note) VALUES ($1, $2, $3, 'EARN', $4, $5, $6)`,
        [randomUUID(), input.tenantId, member.id, pointsEarned, saleId, `Poin dari transaksi ${invoiceNumber}`],
      );
      await client.query(
        `INSERT INTO "AuditLog" (id, "tenantId", "userId", action, description) VALUES ($1, $2, $3, 'MEMBER_POINTS_EARN', $4)`,
        [randomUUID(), input.tenantId, input.userId, `${member.name} dapat ${pointsEarned} poin (${invoiceNumber})`],
      );
    }
    await client.query(
      `INSERT INTO "MarketCheckoutRequest" (id, "tenantId", "requestId", "saleId", "createdAt") VALUES ($1, $2, $3, $4, NOW())`,
      [randomUUID(), input.tenantId, requestId, saleId],
    );
    await client.query("COMMIT");
    return { id: saleId, invoiceNumber, total, change, reused: false };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listMarketSales({ tenantId, userId, role }: AccessibleUser): Promise<MarketSale[]> {
  const result = await db.query<{ id: string; invoice_number: string; outlet_name: string; cashier_name: string; total: string; payment_method: PaymentMethod; amount_paid: string; change_amount: string; status: "COMPLETED" | "VOIDED"; void_reason: string | null; created_at: Date; items: { id: string; productName: string; price: number; qty: number; subtotal: number }[] }>(
    `WITH outlets AS (SELECT o.id FROM "Outlet" o WHERE ${outletScope(role)} AND o."isActive" = true)
     SELECT s.id, s."invoiceNumber" AS invoice_number, o.name AS outlet_name, u.name AS cashier_name,
            s.total::text, s."paymentMethod" AS payment_method, s."amountPaid"::text AS amount_paid,
            s."changeAmount"::text AS change_amount, s.status, s."voidReason" AS void_reason, s."createdAt" AS created_at,
            COALESCE(jsonb_agg(jsonb_build_object('id', si.id, 'productName', si."productName", 'price', si.price, 'qty', si.qty, 'subtotal', si.subtotal) ORDER BY si."productName") FILTER (WHERE si.id IS NOT NULL), '[]'::jsonb) AS items
       FROM "Sale" s
       INNER JOIN "Outlet" o ON o.id = s."outletId" AND o."tenantId" = s."tenantId"
       INNER JOIN "User" u ON u.id = s."cashierId" AND u."tenantId" = s."tenantId"
       LEFT JOIN "SaleItem" si ON si."saleId" = s.id AND si."tenantId" = s."tenantId"
      WHERE s."tenantId" = $1 AND s."outletId" IN (SELECT id FROM outlets)
      GROUP BY s.id, o.name, u.name
      ORDER BY s."createdAt" DESC
      LIMIT 100`,
    [tenantId, userId],
  );
  return result.rows.map((row) => ({ id: row.id, invoiceNumber: row.invoice_number, outletName: row.outlet_name, cashierName: row.cashier_name, total: Number(row.total), paymentMethod: row.payment_method, amountPaid: Number(row.amount_paid), changeAmount: Number(row.change_amount), status: row.status, voidReason: row.void_reason, createdAt: row.created_at, items: row.items }));
}

export async function getMarketSale({ tenantId, saleId }: { tenantId: string; saleId: string }): Promise<MarketSale | null> {
  const result = await db.query<{ id: string; invoice_number: string; outlet_name: string; cashier_name: string; total: string; payment_method: PaymentMethod; amount_paid: string; change_amount: string; status: "COMPLETED" | "VOIDED"; void_reason: string | null; created_at: Date; items: { id: string; productName: string; price: number; qty: number; subtotal: number }[] }>(
    `SELECT s.id, s."invoiceNumber" AS invoice_number, o.name AS outlet_name, u.name AS cashier_name,
            s.total::text, s."paymentMethod" AS payment_method, s."amountPaid"::text AS amount_paid,
            s."changeAmount"::text AS change_amount, s.status, s."voidReason" AS void_reason, s."createdAt" AS created_at,
            COALESCE(jsonb_agg(jsonb_build_object('id', si.id, 'productName', si."productName", 'price', si.price, 'qty', si.qty, 'subtotal', si.subtotal) ORDER BY si."productName") FILTER (WHERE si.id IS NOT NULL), '[]'::jsonb) AS items
       FROM "Sale" s
       INNER JOIN "Outlet" o ON o.id = s."outletId" AND o."tenantId" = s."tenantId"
       INNER JOIN "User" u ON u.id = s."cashierId" AND u."tenantId" = s."tenantId"
       LEFT JOIN "SaleItem" si ON si."saleId" = s.id AND si."tenantId" = s."tenantId"
      WHERE s.id = $1 AND s."tenantId" = $2
      GROUP BY s.id, o.name, u.name`,
    [saleId, tenantId],
  );
  const row = result.rows[0];
  return row ? { id: row.id, invoiceNumber: row.invoice_number, outletName: row.outlet_name, cashierName: row.cashier_name, total: Number(row.total), paymentMethod: row.payment_method, amountPaid: Number(row.amount_paid), changeAmount: Number(row.change_amount), status: row.status, voidReason: row.void_reason, createdAt: row.created_at, items: row.items } : null;
}

export async function voidMarketSale(input: AccessibleUser & { saleId: string; reason: string }) {
  const reason = input.reason.trim();
  if (!reason) throw new Error("Alasan pembatalan wajib diisi.");
  if (reason.length > MAX_AUDIT_NOTE_LENGTH) throw new Error("Alasan pembatalan maksimal 500 karakter.");
  if (input.role === "STAFF") throw new Error("Hanya pemilik atau manajer yang dapat membatalkan transaksi.");
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const saleResult = await client.query<{ id: string; outlet_id: string; invoice_number: string; status: "COMPLETED" | "VOIDED" }>(
      `SELECT s.id, s."outletId" AS outlet_id, s."invoiceNumber" AS invoice_number, s.status FROM "Sale" s
        WHERE s.id = $1 AND s."tenantId" = $2
          AND ($4::text = 'OWNER' OR EXISTS (SELECT 1 FROM "UserOutlet" uo WHERE uo."tenantId" = s."tenantId" AND uo."outletId" = s."outletId" AND uo."userId" = $3))
        FOR UPDATE`,
      [input.saleId, input.tenantId, input.userId, input.role],
    );
    const sale = saleResult.rows[0];
    if (!sale) throw new Error("Transaksi tidak ditemukan atau tidak berada dalam akses outlet Anda.");
    if (sale.status === "VOIDED") throw new Error("Transaksi ini sudah dibatalkan.");
    const items = await client.query<{ product_id: string; qty: number; product_name: string; track_stock: boolean }>(
      `SELECT si."productId" AS product_id, si.qty, si."productName" AS product_name, p."trackStock" AS track_stock
         FROM "SaleItem" si INNER JOIN "Product" p ON p.id = si."productId" AND p."tenantId" = si."tenantId"
        WHERE si."saleId" = $1 AND si."tenantId" = $2 FOR UPDATE OF si, p`,
      [sale.id, input.tenantId],
    );
    for (const item of items.rows) {
      if (item.track_stock) {
        await applyStockMovement(client, {
          tenantId: input.tenantId,
          outletId: sale.outlet_id,
          productId: item.product_id,
          delta: item.qty,
          source: "SALE_VOID",
          sourceId: sale.id,
          actorId: input.userId,
          note: reason,
          idempotencyKey: `void:${sale.id}:${item.product_id}`,
        });
      }
    }
    await client.query(`UPDATE "Sale" SET status = 'VOIDED', "voidReason" = $1, "updatedAt" = NOW() WHERE id = $2 AND "tenantId" = $3`, [reason, sale.id, input.tenantId]);
    await client.query(`INSERT INTO "AuditLog" (id, "tenantId", "userId", action, description, "createdAt") VALUES ($1, $2, $3, 'SALE_VOID', $4, NOW())`, [randomUUID(), input.tenantId, input.userId, `Membatalkan transaksi ${sale.invoice_number}: ${reason}`]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getMarketShiftSummary({ tenantId, userId, shiftId }: Pick<AccessibleUser, "tenantId" | "userId"> & { shiftId: string }): Promise<MarketShiftSummary | null> {
  const shift = await getOpenMarketShift({ tenantId, userId });
  if (!shift || shift.id !== shiftId) return null;
  const totals = await db.query<{ cash_sales: string; cash_transactions: string; digital_sales: string; digital_transactions: string }>(
    `SELECT COALESCE(SUM(total) FILTER (WHERE "paymentMethod" = 'CASH' AND status = 'COMPLETED'), 0)::text AS cash_sales,
            COUNT(*) FILTER (WHERE "paymentMethod" = 'CASH' AND status = 'COMPLETED')::text AS cash_transactions,
            COALESCE(SUM(total) FILTER (WHERE "paymentMethod" <> 'CASH' AND status = 'COMPLETED'), 0)::text AS digital_sales,
            COUNT(*) FILTER (WHERE "paymentMethod" <> 'CASH' AND status = 'COMPLETED')::text AS digital_transactions
       FROM "Sale" WHERE "tenantId" = $1 AND "shiftId" = $2`,
    [tenantId, shiftId],
  );
  const row = totals.rows[0] ?? { cash_sales: "0", cash_transactions: "0", digital_sales: "0", digital_transactions: "0" };
  const breakdown = await db.query<{ method: string; total: string; count: string }>(
    `SELECT s."paymentMethod" AS method, SUM(s.total)::text AS total, COUNT(*)::text AS count
       FROM "Sale" s
      WHERE s."shiftId" = $1 AND s."tenantId" = $2 AND s.status = 'COMPLETED'
      GROUP BY s."paymentMethod"
      ORDER BY SUM(s.total) DESC`,
    [shiftId, tenantId],
  );
  const cashSales = Number(row.cash_sales);
  return { shift, cashSales, cashTransactions: Number(row.cash_transactions), digitalSales: Number(row.digital_sales), digitalTransactions: Number(row.digital_transactions), expectedCash: shift.openingCash + cashSales, paymentBreakdown: breakdown.rows.map((item) => ({ method: item.method, total: Number(item.total), count: Number(item.count) })) };
}

export async function closeMarketShift(input: Pick<AccessibleUser, "tenantId" | "userId"> & { shiftId: string; closingCash: number; varianceNote?: string }) {
  if (!Number.isSafeInteger(input.closingCash) || input.closingCash < 0) throw new Error("Uang kas penutup tidak valid.");
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const shift = await client.query<{ opening_cash: string }>(`SELECT "openingCash"::text AS opening_cash FROM "CashierShift" WHERE id = $1 AND "tenantId" = $2 AND "userId" = $3 AND status = 'OPEN' FOR UPDATE`, [input.shiftId, input.tenantId, input.userId]);
    const current = shift.rows[0];
    if (!current) throw new Error("Shift aktif tidak ditemukan.");
    const cash = await client.query<{ total: string }>(`SELECT COALESCE(SUM(total), 0)::text AS total FROM "Sale" WHERE "tenantId" = $1 AND "shiftId" = $2 AND status = 'COMPLETED' AND "paymentMethod" = 'CASH'`, [input.tenantId, input.shiftId]);
    const expectedCash = Number(current.opening_cash) + Number(cash.rows[0]?.total ?? 0);
    const varianceNote = input.varianceNote?.trim() || null;
    if (varianceNote && varianceNote.length > MAX_AUDIT_NOTE_LENGTH) throw new Error("Alasan selisih maksimal 500 karakter.");
    if (Math.abs(input.closingCash - expectedCash) > CASH_VARIANCE_THRESHOLD && !varianceNote) throw new Error(`Selisih kas melebihi Rp${CASH_VARIANCE_THRESHOLD.toLocaleString("id-ID")}. Isi alasannya terlebih dahulu.`);
    await client.query(`UPDATE "CashierShift" SET status = 'CLOSED', "closingCash" = $1, "expectedCash" = $2, "varianceNote" = $3, "closedAt" = NOW() WHERE id = $4 AND "tenantId" = $5`, [input.closingCash, expectedCash, varianceNote, input.shiftId, input.tenantId]);
    await client.query("COMMIT");
    return { expectedCash };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
