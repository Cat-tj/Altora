# PROJECT — Altora

Project name: Altora
Repository: Cat-tj/Altora
Canonical repository: https://github.com/Cat-tj/Altora
Default branch: master
Archive baseline: archive/failed-rewrite-2026-08-03 (IMMUTABLE)
Current objective: Recover Altora using verified ShadyERP business behavior
Architecture: Monorepo (apps: admin, landing, market, resto; packages: core, ui, pos-core, market-pos, resto-pos, eslint-config, typescript-config)
Technology stack: Next.js, Supabase (PostgreSQL), Turbo, pnpm-style npm workspaces
Business invariants: ShadyERP = canonical functional reference; copy behavior, do not blindly rewrite; verified Altora transaction cores must be evaluated before replacement; no fake product shells; no authorization through hidden navigation only; no route parity claims based only on route count
Security invariants: tenant isolation, outlet isolation, role/ownership checks on every data path; no production DB mutation without approval
Branch policy: task branches from approved checkpoint; no direct master edits; PR review gate
Deployment policy: VPS push/tag/deploy only after full test evidence + explicit release authorization
Production restrictions: no migration, no schema change, no deploy without explicit approval
Forbidden actions: move/delete/recreate archive tag; force push; git reset --hard; git add -A without scope; production database mutation without approval
