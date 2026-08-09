-- 0010: Stock transfer ledger integrity
-- Alur transfer antar cabang harus menulis StockLedger (sebelumnya hanya
-- INSERT StockTransfer tanpa memindahkan stok — stok transfer hilang dari sistem).

ALTER TYPE "StockLedgerSource" ADD VALUE IF NOT EXISTS 'TRANSFER_OUT';
ALTER TYPE "StockLedgerSource" ADD VALUE IF NOT EXISTS 'TRANSFER_IN';

-- idempotencyKey unik di StockTransfer mencegah transfer ganda saat retry.
ALTER TABLE "StockTransfer" ADD COLUMN IF NOT EXISTS "appliedAt" timestamptz;
ALTER TABLE "StockTransfer" ADD COLUMN IF NOT EXISTS "idempotencyKey" text;
DROP INDEX IF EXISTS "StockTransfer_idempotencyKey_key";
CREATE UNIQUE INDEX "StockTransfer_idempotencyKey_key" ON "StockTransfer" ("idempotencyKey");
