import { randomUUID } from "node:crypto";
import process from "node:process";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

/**
 * Isi data awal Market untuk pengembangan lokal.
 *
 * Tujuannya satu: `npm run db:setup` lalu `npm run dev` langsung bisa dipakai
 * tanpa menyalin database dari mana pun. Data ini bukan fixture untuk test —
 * test integrasi menyiapkan datanya sendiri.
 *
 * Idempoten lewat ON CONFLICT, jadi aman dijalankan berulang.
 */
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL Market belum diatur.");

if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
  throw new Error("Seed ditolak di production. Setel ALLOW_PRODUCTION_SEED=true bila memang disengaja.");
}

const pool = new Pool({ connectionString: databaseUrl });

const id = (prefix) => `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 20)}`;

const TENANT = "seed_tenant_market";
const OUTLET = "seed_outlet_utama";
const PASSWORD = process.env.SEED_PASSWORD ?? "altora123";

const KATEGORI = [
  { id: "seed_cat_sembako", name: "Sembako" },
  { id: "seed_cat_minuman", name: "Minuman" },
  { id: "seed_cat_snack", name: "Snack" },
];

/* Harga dalam rupiah penuh — kolomnya integer, tidak ada sen. */
const PRODUK = [
  { id: "seed_p_beras5", categoryId: "seed_cat_sembako", name: "Beras Premium 5kg", sku: "8991234500011", price: 68000, qty: 40 },
  { id: "seed_p_minyak2", categoryId: "seed_cat_sembako", name: "Minyak Goreng 2L", sku: "8991234500028", price: 34000, qty: 25 },
  { id: "seed_p_gula1", categoryId: "seed_cat_sembako", name: "Gula Pasir 1kg", sku: "8991234500035", price: 16000, qty: 4 },
  { id: "seed_p_telur1", categoryId: "seed_cat_sembako", name: "Telur Ayam 1kg", sku: "8991234500042", price: 29000, qty: 18 },
  { id: "seed_p_aqua600", categoryId: "seed_cat_minuman", name: "Aqua 600ml", sku: "8991234500059", price: 4000, qty: 120 },
  { id: "seed_p_teh350", categoryId: "seed_cat_minuman", name: "Teh Kotak 350ml", sku: "8991234500066", price: 5500, qty: 60 },
  { id: "seed_p_kopi", categoryId: "seed_cat_minuman", name: "Kopi Sachet 20g", sku: "8991234500073", price: 2500, qty: 200 },
  { id: "seed_p_indomie", categoryId: "seed_cat_snack", name: "Indomie Goreng", sku: "8991234500080", price: 3500, qty: 150 },
  { id: "seed_p_chitato", categoryId: "seed_cat_snack", name: "Chitato 68g", sku: "8991234500097", price: 12000, qty: 3 },
  { id: "seed_p_roti", categoryId: "seed_cat_snack", name: "Roti Tawar Gandum", sku: "8991234500103", price: 18500, qty: 12 },
];

const SUPPLIER = [
  { id: "seed_sup_sinar", name: "CV Sinar Sembako", phone: "0812-1111-2222", contactPerson: "Pak Hadi", paymentTerms: "Net 30" },
  { id: "seed_sup_tirta", name: "PT Tirta Minuman", phone: "0813-3333-4444", contactPerson: "Bu Rina", paymentTerms: "COD" },
];

const PENGGUNA = [
  { id: "seed_user_owner", name: "Pemilik Toko", email: "owner@altora.test", role: "OWNER" },
  { id: "seed_user_manager", name: "Manajer Toko", email: "manajer@altora.test", role: "MANAGER" },
  { id: "seed_user_staff", name: "Kasir Toko", email: "kasir@altora.test", role: "STAFF" },
];

const client = await pool.connect();

try {
  await client.query("BEGIN");

  await client.query(
    `INSERT INTO "Tenant" (id, name, slug, "businessType", plan) VALUES ($1, $2, $3, 'RETAIL', 'FREE')
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug`,
    [TENANT, "Toko Berkah Sejahtera", "toko-berkah-sejahtera"],
  );

  await client.query(
    `INSERT INTO "Outlet" (id, "tenantId", name) VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
    [OUTLET, TENANT, "Outlet Utama"],
  );

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  for (const user of PENGGUNA) {
    await client.query(
      `INSERT INTO "User" (id, "tenantId", name, email, "passwordHash", role)
       VALUES ($1, $2, $3, $4, $5, $6::"UserRole")
       ON CONFLICT (id) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", role = EXCLUDED.role`,
      [user.id, TENANT, user.name, user.email, passwordHash, user.role],
    );

    /* Owner melihat semua outlet lewat role, jadi tidak perlu dipetakan. */
    if (user.role !== "OWNER") {
      await client.query(
        `INSERT INTO "UserOutlet" (id, "tenantId", "userId", "outletId") VALUES ($1, $2, $3, $4)
         ON CONFLICT ("userId", "outletId") DO NOTHING`,
        [id("uo"), TENANT, user.id, OUTLET],
      );
    }
  }

  for (const supplier of SUPPLIER) {
    await client.query(
      `INSERT INTO "Supplier" (id, "tenantId", name, phone, "contactPerson", "paymentTerms")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone`,
      [supplier.id, TENANT, supplier.name, supplier.phone, supplier.contactPerson, supplier.paymentTerms],
    );
  }

  for (const category of KATEGORI) {
    await client.query(
      `INSERT INTO "Category" (id, "tenantId", name) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [category.id, TENANT, category.name],
    );
  }

  for (const product of PRODUK) {
    await client.query(
      `INSERT INTO "Product" (id, "tenantId", "categoryId", name, sku, price)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price`,
      [product.id, TENANT, product.categoryId, product.name, product.sku, product.price],
    );

    const psResult = await client.query(
      `INSERT INTO "ProductStock" (id, "tenantId", "productId", "outletId", qty)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ("productId", "outletId") DO UPDATE SET qty = EXCLUDED.qty
       RETURNING id`,
      [id("ps"), TENANT, product.id, OUTLET, product.qty],
    );
    const psId = psResult.rows[0].id;

    // Saldo awal wajib dijelaskan ledger (invariant akuntansi: qty == SUM(delta)).
    // Idempoten via idempotencyKey — seed ulang tidak menggandakan baris.
    // Konvensi 'opening:' sama dengan backfill di migration 0002.
    await client.query(
      `INSERT INTO "StockLedger"
        (id, "tenantId", "outletId", "productId", delta, "balanceAfter", source, "sourceId", note, "idempotencyKey")
       VALUES ($1, $2, $3, $4, $5, $5, 'OPENING', $6, $7, $8)
       ON CONFLICT ("idempotencyKey") DO NOTHING`,
      [id("sl"), TENANT, OUTLET, product.id, product.qty, psId, "Saldo awal (seed)", `opening:${psId}`],
    );
  }

  /* Ambang restock dipasang di 5 supaya Gula dan Chitato langsung muncul
     sebagai stok menipis — layar beranda punya sesuatu untuk ditampilkan. */
  for (const product of PRODUK) {
    await client.query(
      `INSERT INTO "StockReorderPoint" (id, "tenantId", "productId", "outletId", "minQty")
       VALUES ($1, $2, $3, $4, 5)
       ON CONFLICT ("productId", "outletId") DO NOTHING`,
      [id("rp"), TENANT, product.id, OUTLET],
    );
  }

  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}

console.log(`Seed Market selesai.

  Tenant  : Toko Berkah Sejahtera
  Outlet  : Outlet Utama
  Produk  : ${PRODUK.length} (2 di antaranya sudah di bawah ambang restock)
  Supplier: ${SUPPLIER.length}

  Masuk dengan salah satu akun berikut, kata sandi "${PASSWORD}":
${PENGGUNA.map((u) => `    ${u.role.padEnd(8)} ${u.email}`).join("\n")}
`);
