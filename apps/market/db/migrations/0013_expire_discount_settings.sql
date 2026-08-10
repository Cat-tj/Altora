-- Migration 0013: Tambah kolom pengaturan diskon produk kadaluwarsa ke TenantSetting
-- Mendukung mode otomatis (auto) dan manual, threshold hari, dan persentase diskon

ALTER TABLE "TenantSetting"
  ADD COLUMN IF NOT EXISTS "expireDiscountEnabled"  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "expireDiscountMode"     text    NOT NULL DEFAULT 'manual',  -- 'auto' | 'manual'
  ADD COLUMN IF NOT EXISTS "expireDiscountDays"     integer NOT NULL DEFAULT 30,        -- berapa hari sebelum expire
  ADD COLUMN IF NOT EXISTS "expireDiscountPercent"  integer NOT NULL DEFAULT 20;        -- persen diskon (0-100)
