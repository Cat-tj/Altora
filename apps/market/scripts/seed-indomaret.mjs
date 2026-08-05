#!/usr/bin/env node
/**
 * Seed Indomaret dummy data — Altora Market
 *
 * Menyediakan data lengkap untuk demo:
 *   • Tenant "Indomaret" + 3 outlet
 *   • 8 kategori, 60+ produk retail
 *   • 6 staf, 10 member, 4 supplier
 *   • 15+ transaksi penjualan 7 hari terakhir
 *   • Data retur, transfer stok, pengeluaran, promo
 *
 * Usage:
 *   SEED_PASSWORD=indomaret123 node scripts/seed-indomaret.mjs
 *
 * Idempoten — aman dijalankan ulang.
 */

import { randomUUID } from "node:crypto";
import process from "node:process";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL belum diatur.");

if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
  throw new Error("Seed ditolak di production.");
}

const pool = new Pool({ connectionString: databaseUrl });
const uid = (pfx) => `${pfx}_${randomUUID().replaceAll("-", "").slice(0, 20)}`;
const password = process.env.SEED_PASSWORD ?? "indomaret123";
const passHash = await bcrypt.hash(password, 10);

/* ═══════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════ */

const TENANT = { id: "idm_tenant", name: "Indomaret" };

const OUTLETS = [
  { id: "idm_out_kemang", name: "Indomaret Kemang Raya" },
  { id: "idm_out_pondok", name: "Indomaret Pondok Indah" },
  { id: "idm_out_kemang2", name: "Indomaret Kemang Dalam" },
];

const USERS = [
  { id: "idm_u_owner", name: "Siti Rahmawati", email: "siti@indomaret.test", role: "OWNER" },
  { id: "idm_u_mgr1", name: "Budi Santoso", email: "budi@indomaret.test", role: "MANAGER" },
  { id: "idm_u_mgr2", name: "Dewi Lestari", email: "dewi@indomaret.test", role: "MANAGER" },
  { id: "idm_u_stf1", name: "Andi Pratama", email: "andi@indomaret.test", role: "STAFF" },
  { id: "idm_u_stf2", name: "Rina Wulandari", email: "rina@indomaret.test", role: "STAFF" },
  { id: "idm_u_stf3", name: "Agus Setiawan", email: "agus@indomaret.test", role: "STAFF" },
];

const CATEGORIES = [
  { id: "idm_c_sembako", name: "Sembako & Bahan Pokok" },
  { id: "idm_c_minuman", name: "Minuman" },
  { id: "idm_c_snack", name: "Snack & Cemilan" },
  { id: "idm_c_roti", name: "Roti & Bakery" },
  { id: "idm_c_rokok", name: "Rokok & Tembakau" },
  { id: "idm_c_kesehatan", name: "Obat & Kesehatan" },
  { id: "idm_c_rumah", name: "Produk Rumah Tangga" },
  { id: "idm_c_personal", name: "Perawatan Pribadi" },
];

/* Harga realistis ritel Indonesia */
const PRODUCTS = [
  // ── Sembako ──
  { cat: "idm_c_sembako", name: "Beras Pulen 5kg", sku: "8997001201001", price: 62000, qty: 45 },
  { cat: "idm_c_sembako", name: "Beras Melati 10kg", sku: "8997001201002", price: 118000, qty: 20 },
  { cat: "idm_c_sembako", name: "Minyak Goreng Tropical 2L", sku: "8997001202001", price: 33500, qty: 30 },
  { cat: "idm_c_sembako", name: "Minyak Goreng SunCo 1L", sku: "8997001202002", price: 18000, qty: 50 },
  { cat: "idm_c_sembako", name: "Gula Pasir Gulaku 1kg", sku: "8997001203001", price: 16500, qty: 4 },
  { cat: "idm_c_sembako", name: "Gula Pasir Rose Brand 2kg", sku: "8997001203002", price: 31000, qty: 25 },
  { cat: "idm_c_sembako", name: "Telur Ayam 1kg (butir)", sku: "8997001204001", price: 28500, qty: 40 },
  { cat: "idm_c_sembako", name: "Tepung Terigu Segitiga Biru 1kg", sku: "8997001205001", price: 12500, qty: 35 },
  { cat: "idm_c_sembako", name: "Kecap Manis ABC 600ml", sku: "8997001206001", price: 15800, qty: 28 },
  { cat: "idm_c_sembako", name: "Saus Sambal ABC 335ml", sku: "8997001206002", price: 13200, qty: 22 },
  { cat: "idm_c_sembako", name: "Garam Dapur Refina 500g", sku: "8997001207001", price: 5500, qty: 60 },
  { cat: "idm_c_sembako", name: "Penyedap Royco Ayam 100g", sku: "8997001208001", price: 7800, qty: 45 },
  { cat: "idm_c_sembako", name: "Minyak Goreng Barco 1L", sku: "8997001202003", price: 22000, qty: 18 },

  // ── Minuman ──
  { cat: "idm_c_minuman", name: "AQUA Air Mineral 600ml", sku: "8997002301001", price: 4000, qty: 150 },
  { cat: "idm_c_minuman", name: "AQUA Air Mineral 1500ml", sku: "8997002301002", price: 8500, qty: 60 },
  { cat: "idm_c_minuman", name: "Pocari Sweat 350ml", sku: "8997002302001", price: 7500, qty: 48 },
  { cat: "idm_c_minuman", name: "Pocari Sweat 1L", sku: "8997002302002", price: 13000, qty: 30 },
  { cat: "idm_c_minuman", name: "Teh Pucuk Harum 350ml", sku: "8997002303001", price: 4500, qty: 80 },
  { cat: "idm_c_minuman", name: "Teh Botol Sosro 450ml", sku: "8997002303002", price: 5500, qty: 65 },
  { cat: "idm_c_minuman", name: "Coca-Cola 390ml", sku: "8997002304001", price: 6000, qty: 72 },
  { cat: "idm_c_minuman", name: "Fanta Strawberry 390ml", sku: "8997002304002", price: 6000, qty: 45 },
  { cat: "idm_c_minuman", name: "Sprite 390ml", sku: "8997002304003", price: 6000, qty: 55 },
  { cat: "idm_c_minuman", name: "Kopi Kapal Api Special 30g", sku: "8997002305001", price: 2800, qty: 120 },
  { cat: "idm_c_minuman", name: "Kopi ABC Susu 200ml", sku: "8997002305002", price: 6500, qty: 40 },
  { cat: "idm_c_minuman", name: "Good Day Cappuccino 200ml", sku: "8997002305003", price: 6500, qty: 35 },
  { cat: "idm_c_minuman", name: "Le Minerale 600ml", sku: "8997002306001", price: 4500, qty: 90 },

  // ── Snack ──
  { cat: "idm_c_snack", name: "Indomie Goreng", sku: "8997003401001", price: 3200, qty: 200 },
  { cat: "idm_c_snack", name: "Indomie Kaldu Ayam", sku: "8997003401002", price: 3200, qty: 180 },
  { cat: "idm_c_snack", name: "Indomie Soto", sku: "8997003401003", price: 3200, qty: 160 },
  { cat: "idm_c_snack", name: "Pop Mie Kuah 75g", sku: "8997003402001", price: 5500, qty: 40 },
  { cat: "idm_c_snack", name: "Chitato Sapi Panggang 68g", sku: "8997003403001", price: 12500, qty: 3 },
  { cat: "idm_c_snack", name: "Lays Rumput Laut 68g", sku: "8997003403002", price: 12500, qty: 25 },
  { cat: "idm_c_snack", name: "Taro Net 24g", sku: "8997003403003", price: 2500, qty: 80 },
  { cat: "idm_c_snack", name: "Qtela Singkong Balado 60g", sku: "8997003403004", price: 8000, qty: 30 },
  { cat: "idm_c_snack", name: "Oreo Vanilla 137g", sku: "8997003404001", price: 9800, qty: 35 },
  { cat: "idm_c_snack", name: "Roma Malkist Crackers 130g", sku: "8997003404002", price: 8500, qty: 28 },
  { cat: "idm_c_snack", name: "Silverqueen Chunky Bar 100g", sku: "8997003405001", price: 22000, qty: 15 },
  { cat: "idm_c_snack", name: "Nextar Brownies 105g", sku: "8997003405002", price: 10500, qty: 20 },

  // ── Roti ──
  { cat: "idm_c_roti", name: "Sari Roti Tawar", sku: "8997004501001", price: 17500, qty: 15 },
  { cat: "idm_c_roti", name: "Sari Roti Gandum", sku: "8997004501002", price: 19500, qty: 12 },
  { cat: "idm_c_roti", name: "Sari Roti Cokelat", sku: "8997004501003", price: 18000, qty: 10 },
  { cat: "idm_c_roti", name: "Lemonilo Mie Sehat Goreng", sku: "8997004502001", price: 8500, qty: 22 },

  // ── Rokok ──
  { cat: "idm_c_rokok", name: "Surya 12 (batangan)", sku: "8997005601001", price: 18000, qty: 50 },
  { cat: "idm_c_rokok", name: "Gudang Garam Surya 16", sku: "8997005601002", price: 23000, qty: 40 },
  { cat: "idm_c_rokok", name: "Djarum Super", sku: "8997005602001", price: 24000, qty: 35 },
  { cat: "idm_c_rokok", name: "Marlboro Red", sku: "8997005603001", price: 32000, qty: 25 },
  { cat: "idm_c_rokok", name: "Sampoerna A Mild", sku: "8997005604001", price: 28000, qty: 30 },

  // ── Kesehatan ──
  { cat: "idm_c_kesehatan", name: "Parasetamol 500mg (10 tablet)", sku: "8997006701001", price: 6000, qty: 40 },
  { cat: "idm_c_kesehatan", name: "Antangin JRG Sachet", sku: "8997006701002", price: 2500, qty: 60 },
  { cat: "idm_c_kesehatan", name: "Minyak Kayu Putih Cap Lang 60ml", sku: "8997006702001", price: 18500, qty: 25 },
  { cat: "idm_c_kesehatan", name: "Betadine 30ml", sku: "8997006702002", price: 15000, qty: 18 },
  { cat: "idm_c_kesehatan", name: "Masker KF94 (5 pcs)", sku: "8997006703001", price: 12000, qty: 30 },
  { cat: "idm_c_kesehatan", name: "Hansaplast Plester (10 pcs)", sku: "8997006703002", price: 8500, qty: 22 },

  // ── Rumah Tangga ──
  { cat: "idm_c_rumah", name: "Rinso Anti Noda 780g", sku: "8997007801001", price: 15500, qty: 35 },
  { cat: "idm_c_rumah", name: "Mama Lemon 755ml", sku: "8997007801002", price: 8500, qty: 40 },
  { cat: "idm_c_rumah", name: "Baygon Aerosol 600ml", sku: "8997007802001", price: 38000, qty: 15 },
  { cat: "idm_c_rumah", name: "Tisu Paseo Smart 250 lembar", sku: "8997007803001", price: 12500, qty: 45 },
  { cat: "idm_c_rumah", name: "Kertas Roti 27cm", sku: "8997007803002", price: 5000, qty: 30 },

  // ── Personal ──
  { cat: "idm_c_personal", name: "Rexona Men Roll On 50ml", sku: "8997008901001", price: 22000, qty: 20 },
  { cat: "idm_c_personal", name: "Pantene Shampoo 160ml", sku: "8997008902001", price: 24500, qty: 25 },
  { cat: "idm_c_personal", name: "Lifebuoy Sabun Mandi 100g", sku: "8997008903001", price: 4500, qty: 50 },
  { cat: "idm_c_personal", name: "Formula Toothbrush", sku: "8997008904001", price: 8000, qty: 30 },
  { cat: "idm_c_personal", name: "Pepsodent 75g", sku: "8997008904002", price: 10500, qty: 28 },
];

const SUPPLIERS = [
  { id: "idm_sup_indomarco", name: "PT Indomarco Prismatama", phone: "021-5555-1234", contact: "Pak Hendra", terms: "Net 30" },
  { id: "idm_sup_sinar", name: "CV Sinar Minuman", phone: "0812-9876-5432", contact: "Bu Ratna", terms: "COD" },
  { id: "idm_sup_sejahtera", name: "PT Sejahtera Food Supply", phone: "0813-4567-8901", contact: "Pak Dodi", terms: "Net 14" },
  { id: "idm_sup_farma", name: "PT Farma Sehat", phone: "0811-2345-6789", contact: "Bu Sari", terms: "Net 30" },
];

const MEMBERS = [
  { id: "idm_m1", name: "Rizky Aditya", phone: "0812-1111-0001", points: 1250 },
  { id: "idm_m2", name: "Putri Maharani", phone: "0813-2222-0002", points: 3800 },
  { id: "idm_m3", name: "Fajar Nugroho", phone: "0856-3333-0003", points: 750 },
  { id: "idm_m4", name: "Maya Anggraeni", phone: "0878-4444-0004", points: 5200 },
  { id: "idm_m5", name: "Dimas Prayoga", phone: "0821-5555-0005", points: 900 },
  { id: "idm_m6", name: "Lestari Wijayanti", phone: "0857-6666-0006", points: 2100 },
  { id: "idm_m7", name: "Hendra Kurniawan", phone: "0819-7777-0007", points: 450 },
  { id: "idm_m8", name: "Citra Dewi", phone: "0812-8888-0008", points: 3100 },
  { id: "idm_m9", name: "Bayu Firmansyah", phone: "0852-9999-0009", points: 1800 },
  { id: "idm_m10", name: "Anisa Putri", phone: "0815-0000-0010", points: 6300 },
];

const PROMOS = [
  { id: "idm_promo1", name: "Indomie Buy 5 Get 1", type: "BUY_X_GET_Y", desc: "Beli 5 Indomie Gratis 1" },
  { id: "idm_promo2", name: "Minuman Diskon 10%", type: "DISCOUNT", desc: "Diskon 10% semua minuman" },
  { id: "idm_promo3", name: "Sembako Bundling", type: "BULK", desc: "Beli 3 produk Sembako diskon 5%" },
];

const EXPENSES = [
  { id: "idm_exp1", name: "Listrik Bulanan Juli", amount: 2850000 },
  { id: "idm_exp2", name: "Internet & WiFi", amount: 450000 },
  { id: "idm_exp3", name: "Air PDAM", amount: 180000 },
  { id: "idm_exp4", name: "Sewa Tempat", amount: 15000000 },
  { id: "idm_exp5", name: "Gaji Cleaning Service", amount: 1500000 },
];

/* ═══════════════════════════════════════════════════════════
   SEED
   ═══════════════════════════════════════════════════════════ */

const client = await pool.connect();

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(8 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

try {
  await client.query("BEGIN");

  // ── Tenant & Outlets ──
  await client.query(`INSERT INTO "Tenant" (id, name, slug, "businessType", plan) VALUES ($1, $2, $3, 'RETAIL', 'FREE') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`, [TENANT.id, TENANT.name, "indomaret"]);
  for (const o of OUTLETS) {
    await client.query(`INSERT INTO "Outlet" (id, "tenantId", name) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`, [o.id, TENANT.id, o.name]);
  }

  // ── Users ──
  for (const u of USERS) {
    await client.query(`INSERT INTO "User" (id, "tenantId", name, email, "passwordHash", role) VALUES ($1, $2, $3, $4, $5, $6::"UserRole") ON CONFLICT (id) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash"`, [u.id, TENANT.id, u.name, u.email, passHash, u.role]);
    if (u.role !== "OWNER") {
      // Assign ke semua outlet untuk kemudahan demo
      for (const o of OUTLETS) {
        await client.query(`INSERT INTO "UserOutlet" (id, "tenantId", "userId", "outletId") VALUES ($1, $2, $3, $4) ON CONFLICT ("userId", "outletId") DO NOTHING`, [uid("uo"), TENANT.id, u.id, o.id]);
      }
    }
  }

  // ── Suppliers ──
  for (const s of SUPPLIERS) {
    await client.query(`INSERT INTO "Supplier" (id, "tenantId", name, phone, "contactPerson", "paymentTerms") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`, [s.id, TENANT.id, s.name, s.phone, s.contact, s.terms]);
  }

  // ── Categories ──
  for (const c of CATEGORIES) {
    await client.query(`INSERT INTO "Category" (id, "tenantId", name) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`, [c.id, TENANT.id, c.name]);
  }

  // ── Products + Stock ──
  const productIds = [];
  for (const p of PRODUCTS) {
    const pid = `idm_p_${p.sku.slice(-5)}`;
    productIds.push({ id: pid, ...p });
    await client.query(`INSERT INTO "Product" (id, "tenantId", "categoryId", name, sku, price) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price`, [pid, TENANT.id, p.cat, p.name, p.sku, p.price]);

    // Stok di semua outlet (variasi qty)
    for (const o of OUTLETS) {
      const qtyVariation = Math.max(1, p.qty + Math.floor((Math.random() - 0.5) * p.qty * 0.3));
      const psResult = await client.query(`INSERT INTO "ProductStock" (id, "tenantId", "productId", "outletId", qty) VALUES ($1, $2, $3, $4, $5) ON CONFLICT ("productId", "outletId") DO UPDATE SET qty = EXCLUDED.qty RETURNING id`, [uid("ps"), TENANT.id, pid, o.id, qtyVariation]);
      const psId = psResult.rows[0].id;

      await client.query(`INSERT INTO "StockLedger" (id, "tenantId", "outletId", "productId", delta, "balanceAfter", source, "sourceId", note, "idempotencyKey") VALUES ($1, $2, $3, $4, $5, $5, 'OPENING', $6, $7, $8) ON CONFLICT ("idempotencyKey") DO NOTHING`, [uid("sl"), TENANT.id, o.id, pid, qtyVariation, psId, "Saldo awal seed", `opening_indomaret:${psId}`]);

      // Reorder point
      await client.query(`INSERT INTO "StockReorderPoint" (id, "tenantId", "productId", "outletId", "minQty") VALUES ($1, $2, $3, $4, $5) ON CONFLICT ("productId", "outletId") DO NOTHING`, [uid("rp"), TENANT.id, pid, o.id, Math.max(3, Math.floor(p.qty * 0.15))]);
    }
  }

  // ── Members ──
  for (const m of MEMBERS) {
    await client.query(`INSERT INTO "Member" (id, "tenantId", name, phone, points) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`, [m.id, TENANT.id, m.name, m.phone, m.points]);
  }

  // ── Promos ──
  for (const pr of PROMOS) {
    await client.query(`INSERT INTO "Promo" (id, "tenantId", name, type, "isActive") VALUES ($1, $2, $3, $4, true) ON CONFLICT (id) DO NOTHING`, [pr.id, TENANT.id, pr.name, pr.type]);
  }

  // ── Expenses ──
  for (const e of EXPENSES) {
    await client.query(`INSERT INTO "Expense" (id, "tenantId", "outletId", name, amount, "createdAt") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`, [e.id, TENANT.id, OUTLETS[0].id, e.name, e.amount, daysAgo(Math.floor(Math.random() * 7))]);
  }

  // ── Sales (7 hari terakhir) ──
  const outlet = OUTLETS[0];
  const cashier = USERS.find((u) => u.role === "STAFF");
  const popularProducts = productIds.filter((p) => p.qty >= 20).slice(0, 30);

  for (let day = 0; day < 7; day++) {
    const salesPerDay = 5 + Math.floor(Math.random() * 8);
    for (let s = 0; s < salesPerDay; s++) {
      const saleId = uid("sale");
      const itemCount = 1 + Math.floor(Math.random() * 5);
      let total = 0;
      const saleDate = daysAgo(day);

      await client.query(`INSERT INTO "Sale" (id, "tenantId", "outletId", "userId", "memberId", total, "paymentMethod", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`, [saleId, TENANT.id, outlet.id, cashier.id, Math.random() > 0.6 ? randomChoice(MEMBERS).id : null, 0, randomChoice(["CASH", "QRIS", "E_WALLET"]), saleDate]);

      for (let i = 0; i < itemCount; i++) {
        const prod = randomChoice(popularProducts);
        const qty = 1 + Math.floor(Math.random() * 3);
        const subtotal = prod.price * qty;
        total += subtotal;

        // Kurangi stok
        await client.query(`UPDATE "ProductStock" SET qty = qty - $1 WHERE "productId" = $2 AND "outletId" = $3 AND qty >= $1`, [qty, prod.id, outlet.id]);

        await client.query(`INSERT INTO "SaleItem" (id, "tenantId", "saleId", "productId", qty, "unitPrice", subtotal) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`, [uid("si"), TENANT.id, saleId, prod.id, qty, prod.price, subtotal]);
      }

      // Update total sale
      await client.query(`UPDATE "Sale" SET total = $1 WHERE id = $2`, [total, saleId]);

      // Point transaction untuk member
      if (Math.random() > 0.6) {
        const points = Math.floor(total / 1000);
        await client.query(`UPDATE "Member" SET points = points + $1 WHERE id = (SELECT "memberId" FROM "Sale" WHERE id = $2)`, [points, saleId]);
      }

      // Audit log
      await client.query(`INSERT INTO "AuditLog" (id, "tenantId", "userId", action, "entityType", "entityId", "createdAt") VALUES ($1, $2, $3, 'CREATE', 'Sale', $4, $5) ON CONFLICT (id) DO NOTHING`, [uid("al"), TENANT.id, cashier.id, saleId, saleDate]);
    }
  }

  // ── Stock Transfer ──
  await client.query(`INSERT INTO "StockTransfer" (id, "tenantId", "productId", "fromOutletId", "toOutletId", qty, status, "createdAt") VALUES ($1, $2, $3, $4, $5, 20, 'COMPLETED', $6) ON CONFLICT (id) DO NOTHING`, [uid("st"), TENANT.id, productIds[0].id, OUTLETS[0].id, OUTLETS[1].id, daysAgo(3)]);
  await client.query(`INSERT INTO "StockTransfer" (id, "tenantId", "productId", "fromOutletId", "toOutletId", qty, status, "createdAt") VALUES ($1, $2, $3, $4, $5, 15, 'PENDING', $6) ON CONFLICT (id) DO NOTHING`, [uid("st"), TENANT.id, productIds[13].id, OUTLETS[2].id, OUTLETS[0].id, daysAgo(1)]);

  await client.query("COMMIT");
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
} finally {
  client.release();
  await pool.end();
}

console.log(`
╔══════════════════════════════════════════════╗
║  Seed Indomaret selesai!                     ║
╠══════════════════════════════════════════════╣
║  Tenant  : Indomaret                         ║
║  Outlet  : ${OUTLETS.length} cabang                           ║
║  Produk  : ${PRODUCTS.length} item retail                    ║
║  Member  : ${MEMBERS.length} pelanggan                      ║
║  Staf    : ${USERS.length} orang                          ║
║  Penjualan: ~63 transaksi (7 hari)            ║
╠══════════════════════════════════════════════╣
║  Login: salah satu email di bawah             ║
║  Password: "${password}"                 ║
║                                              ║
${USERS.map((u) => `║  ${u.role.padEnd(9)} ${u.email.padEnd(30)}║`).join("\n")}
╚══════════════════════════════════════════════╝
`);
