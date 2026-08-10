-- ============================================================
-- Altora — Schema Migration 0008 for Promo & Attendance Columns
-- ============================================================

-- ── 1. Promo ────────────────────────────────────────────────
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "businessType" text DEFAULT 'RETAIL';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS plan text DEFAULT 'FREE';

ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "promotionSnapshot" jsonb;
ALTER TABLE "Promo" ADD COLUMN IF NOT EXISTS "discountAmount" integer;
ALTER TABLE "Promo" ADD COLUMN IF NOT EXISTS "minPurchase" integer DEFAULT 0;
ALTER TABLE "Promo" ADD COLUMN IF NOT EXISTS "ruleType" text;
ALTER TABLE "Promo" ADD COLUMN IF NOT EXISTS "qualifyingQty" integer;
ALTER TABLE "Promo" ADD COLUMN IF NOT EXISTS "rewardQty" integer;
ALTER TABLE "Promo" ADD COLUMN IF NOT EXISTS "qualifyingProductId" text;
ALTER TABLE "Promo" ADD COLUMN IF NOT EXISTS "qualifyingCategoryId" text;
ALTER TABLE "Promo" ADD COLUMN IF NOT EXISTS "rewardProductId" text;
ALTER TABLE "Promo" ADD COLUMN IF NOT EXISTS "rewardCategoryId" text;
ALTER TABLE "Promo" ADD COLUMN IF NOT EXISTS "rewardDiscountPercent" integer;
ALTER TABLE "Promo" ADD COLUMN IF NOT EXISTS "maxRewardQty" integer;
ALTER TABLE "Promo" ADD COLUMN IF NOT EXISTS "archivedAt" timestamptz;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Promo' AND column_name = 'minSpend') THEN
    UPDATE "Promo" SET "minPurchase" = "minSpend" WHERE ("minPurchase" IS NULL OR "minPurchase" = 0) AND "minSpend" IS NOT NULL;
  END IF;
END
$$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Promo' AND column_name = 'discountValue') THEN
    UPDATE "Promo" SET "discountPercent" = "discountValue"
      WHERE ("discountType"::text IN ('PERCENTAGE', 'PERCENT')) AND "discountPercent" IS NULL AND "discountValue" IS NOT NULL;
    UPDATE "Promo" SET "discountAmount" = "discountValue"
      WHERE ("discountType"::text IN ('FIXED_AMOUNT', 'FIXED')) AND "discountAmount" IS NULL AND "discountValue" IS NOT NULL;
  END IF;
END
$$;

-- ── 2. Attendance ───────────────────────────────────────────
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "clockIn" timestamptz DEFAULT NOW();
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "clockOut" timestamptz;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "notes" text;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Attendance' AND column_name = 'clockInAt') THEN
    UPDATE "Attendance" SET "clockIn" = "clockInAt" WHERE "clockIn" IS NULL AND "clockInAt" IS NOT NULL;
  END IF;
END
$$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Attendance' AND column_name = 'clockOutAt') THEN
    UPDATE "Attendance" SET "clockOut" = "clockOutAt" WHERE "clockOut" IS NULL AND "clockOutAt" IS NOT NULL;
  END IF;
END
$$;
