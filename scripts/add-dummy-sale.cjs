const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:altora2026@127.0.0.1:5432/altora_market' });
  await client.connect();

  const userRes = await client.query('SELECT id, "tenantId" FROM "User" LIMIT 1');
  const userId = userRes.rows[0].id;
  const tenantId = userRes.rows[0].tenantId;

  const outletRes = await client.query('SELECT id FROM "Outlet" LIMIT 1');
  const outletId = outletRes.rows[0].id;

  const shiftRes = await client.query('SELECT id FROM "CashierShift" WHERE status = \'OPEN\' LIMIT 1');
  let shiftId;
  if (shiftRes.rows.length === 0) {
    const newShift = await client.query(
      'INSERT INTO "CashierShift" (id, "tenantId", "outletId", "userId", "openingCash", status, "openedAt") VALUES ($1, $2, $3, $4, 100000, \'OPEN\', NOW()) RETURNING id',
      ['shift_' + Date.now(), tenantId, outletId, userId]
    );
    shiftId = newShift.rows[0].id;
  } else {
    shiftId = shiftRes.rows[0].id;
  }

  const prodRes = await client.query('SELECT id, name, price FROM "Product" LIMIT 2');
  const inv = 'INV-' + Math.floor(10000 + Math.random() * 90000);

  const saleRes = await client.query(
    'INSERT INTO "Sale" (id, "tenantId", "outletId", "shiftId", "cashierId", "invoiceNumber", subtotal, "discountAmount", "taxAmount", total, status, "paymentMethod", "amountPaid", "changeAmount", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, 125000, 0, 0, 125000, \'COMPLETED\', \'CASH\', 125000, 0, NOW(), NOW()) RETURNING id',
    ['sale_' + Date.now(), tenantId, outletId, shiftId, userId, inv]
  );

  const saleId = saleRes.rows[0].id;
  const p1 = prodRes.rows[0];

  await client.query(
    'INSERT INTO "SaleItem" (id, "tenantId", "saleId", "productId", "productName", price, qty, "discountAmount", subtotal) VALUES ($1, $2, $3, $4, $5, $6, 2, 0, $7)',
    ['item_' + Date.now(), tenantId, saleId, p1.id, p1.name, p1.price, Number(p1.price) * 2]
  );

  console.log('Successfully created sale transaction:', inv);
  await client.end();
}

run().catch(console.error);
