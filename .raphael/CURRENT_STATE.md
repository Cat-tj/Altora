# CURRENT STATE

Project: Altora
Current Phase: PRODUCTION (deployed)
Current Objective: Recover Altora using verified ShadyERP business behavior
Implementation Approval: GRANTED
Deployment Approval: GRANTED (godemode on)
Current Branch: orchestration/raphael-bootstrap
Current SHA: 59fe0ca (promo engine)
Deployed: market.altora.my.id → 127.0.0.1:3015 (PM2 altora-market)
Rollback: app lama :3013 (~/Altora master) + Caddyfile.bak-imp011-*
Backup: GitHub branch backup/prod-data-20260804
Prod DB: Supabase — migrations 0001..011 ALL applied (additive, data intact)
Active blocker: NONE

## COMPLETED
- IMP-001..011: Recovery loop selesai + deployed ke prod
- POS UI Port: jiplak ShadyERP → Altora (login, POS screen, payment sheet, product cards, cart panel)
- Tailwind v4 + CSS vars ShadyERP di globals.css
- PROMO ENGINE: lib/promo-calc.ts (DISCOUNT/BOGO/BULK), kolom BOGO query di market-promos.ts
- Promo badge di product card + auto-apply di cart (diskon terbesar)
- /api/promos route (tadinya MISSING → form promo 404), PromoForm client (pilih jenis promo)
- Seed: promo "Beli 2 Gratis 1" (BUY_X_GET_Y) aktif di prod
- Verified: BOGO 3x Air Mineral → subtotal 18.000, diskon 6.000, total 12.000 ✅
- 7 unit test promo-calc + 23 suite test PASS

## NEXT (bila lanjut)
- Fitur lain yang masih miss dari ShadyERP (user bilang "banyak yang masih miss"):
  barcode camera scanner, print struk, cash-out modal, offline sync, favorites
