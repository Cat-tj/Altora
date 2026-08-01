# Altora V1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the new Altora monorepo as a verifiable, versioned foundation for the public landing, Cafe, Market, and Super Admin product shells.

**Architecture:** npm workspaces and Turborepo run independent Next.js applications in `apps/`. Shared packages expose only explicit contracts: UI primitives, core utilities, product version metadata, and POS domain contracts. The initial release intentionally ships product shells rather than copying unverified ShadyERP business logic or connecting a production database.

**Tech Stack:** Node.js, npm workspaces, Turborepo, Next.js 16, React 19, TypeScript, GitHub Actions.

## Global Constraints

- Source-of-truth repository: `Cat-tj/Altora`, branch `master`.
- No VPS, DNS, production database, credentials, or legacy repositories are changed.
- Cafe and Market must not import files from each other.
- Shared POS types live only in `packages/pos-core`; Cafe and Market specialization live in their own packages.
- Build only product shells and version-control foundations in this plan; payment, real authentication, database, and production migration require their own reviewed plans.

---

### Task 1: Define workspace and repository operating rules

**Files:**
- Modify: `package.json`
- Modify: `turbo.json`
- Create: `docs/architecture/PRODUCT-BOUNDARIES.md`
- Create: `docs/operations/VERSIONING.md`
- Create: `.github/workflows/verify.yml`

- [ ] **Step 1: Define named workspace commands**

Add root commands for `test`, `test:versions`, `check:boundaries`, and app-scoped development scripts. Configure Turbo tasks for build, lint, type checking, and tests.

- [ ] **Step 2: Document product and version boundaries**

State that `apps/web`, `apps/cafe`, `apps/market`, and `apps/admin` are independently versioned product surfaces. Define release tags as `web-vX.Y.Z`, `cafe-vX.Y.Z`, `market-vX.Y.Z`, `admin-vX.Y.Z`, and `platform-vX.Y.Z`.

- [ ] **Step 3: Add CI verification**

Create a GitHub Actions workflow that runs `npm ci`, `npm run check:boundaries`, `npm run test`, `npm run lint`, `npm run check-types`, and `npm run build` on pushes and pull requests.

### Task 2: Create explicit shared contracts

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/src/product-catalog.ts`
- Create: `packages/core/src/product-catalog.test.mjs`
- Create: `packages/pos-core/package.json`
- Create: `packages/pos-core/src/index.ts`
- Create: `packages/pos-core/src/checkout.ts`
- Create: `packages/pos-core/src/checkout.test.mjs`
- Create: `packages/cafe-pos/package.json`
- Create: `packages/cafe-pos/src/index.ts`
- Create: `packages/market-pos/package.json`
- Create: `packages/market-pos/src/index.ts`

- [ ] **Step 1: Write failing product metadata tests**

Test that every launch product has a unique identifier, a version, and a subdomain URL when it is an application.

- [ ] **Step 2: Implement product catalog contract**

Expose a typed list of `web`, `cafe`, `market`, and `admin` products with independent version strings and host targets.

- [ ] **Step 3: Write failing POS math tests**

Test subtotal, non-negative discount validation, payment remainder, and deterministic receipt total.

- [ ] **Step 4: Implement POS core**

Implement pure checkout calculation functions. Do not add database, payment gateway, or UI state.

- [ ] **Step 5: Define product specialization contracts**

Cafe exposes table/order modifiers types; Market exposes barcode and unit-of-measure types. Both consume `@altora/pos-core`; neither imports another app.

### Task 3: Build the product shells

**Files:**
- Rename: `apps/web` → `apps/landing`
- Delete: `apps/docs`
- Create: `apps/cafe/`
- Create: `apps/market/`
- Create: `apps/admin/`
- Modify: `packages/ui/`

- [ ] **Step 1: Create shared accessible application frame**

Provide brand header, skip link, main landmark, product/version badge, and accessible link/button primitives from `@altora/ui`.

- [ ] **Step 2: Implement landing application**

Create one public `altora.my.id` experience that introduces Cafe and Market, shows their current product versions, and links to their subdomain targets. Do not create per-product marketing landing pages.

- [ ] **Step 3: Implement Cafe application shell**

Render a focused Cafe dashboard shell with an explicitly labeled future POS entry point, current Cafe version, and a link back to the central landing.

- [ ] **Step 4: Implement Market application shell**

Render a focused Market dashboard shell with barcode/retail context, current Market version, and a link back to the central landing.

- [ ] **Step 5: Implement Admin application shell**

Render a clearly internal Super Admin shell, distinct from tenant applications, with a platform version and a non-production access notice.

### Task 4: Enforce boundaries and verify the bootstrap release

**Files:**
- Create: `scripts/check-boundaries.mjs`
- Create: `scripts/check-product-versions.mjs`
- Create: `scripts/check-product-versions.test.mjs`
- Modify: root `package.json`
- Modify: app `package.json` files

- [ ] **Step 1: Write failing boundary tests**

Test that source files under `apps/cafe` do not import `apps/market`, and vice versa; test that app versions match the central catalog.

- [ ] **Step 2: Implement boundary checker**

Scan application source imports and fail with a clear error when cross-app source imports exist.

- [ ] **Step 3: Run full verification**

Run `npm run check:boundaries`, `npm run test`, `npm run lint`, `npm run check-types`, and `npm run build`.

- [ ] **Step 4: Create initial version tags**

After verification, create annotated local tags: `platform-v0.1.0`, `web-v0.1.0`, `cafe-v0.1.0`, `market-v0.1.0`, and `admin-v0.1.0`. Push tags only with the repository publication approval.
