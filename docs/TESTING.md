# RIPPLE Testing Architecture v1.19

## Table Of Contents

- [Philosophy](#philosophy)
- [What To Test](#what-to-test)
- [What NOT To Test](#what-not-to-test)
- [Framework Choice](#framework-choice)
- [Test Folder Layout](#test-folder-layout)
- [Test Categories](#test-categories)
- [Naming Conventions](#naming-conventions)
- [Test Data / Fixtures](#test-data--fixtures)
- [Running Tests](#running-tests)
- [Implementation Milestones](#implementation-milestones)

---

## Philosophy

- **Test behavior, not implementation.** Verify what happens, not how it happens internally. This keeps tests stable during refactoring.
- **Test RIPPLE code, not third-party libraries.** Everything in `scripts/`, `src/`, and the pipeline belongs to RIPPLE. Libraries like `googleapis`, Astro, and Node built-ins are tested by their own ecosystems.
- **Keep tests independent from the production pipeline.** Tests never write to `src/content/`, never modify `.env` configuration, and never call external APIs. All external dependencies are mocked or passed test fixtures.
- **Every feature should have appropriate tests.** New features include tests in the same PR. Test coverage is defined by business value, not a metric.
- **Every bug fix should add regression coverage.** When a defect is found, the fix includes a test that would have caught it.

---

## What To Test

### Business Logic

| Area | File(s) | Priority |
|------|---------|----------|
| Purchase state resolution | `src/utils/purchase-state.ts` | High |
| Order creation from cart | `src/utils/order.ts` | High |
| Cart operations | `src/utils/cart.ts` | Medium |
| Format helpers | `src/utils/format.ts` | Medium |
| Image path resolution | `src/utils/images.ts` | Medium |
| Gallery item assembly | `src/utils/gallery.ts` | Low |
| URL path construction | `src/utils/paths.ts` | Low |
| Submission provider selection | `src/utils/submission.ts` | Low |

### Pipeline

| Area | File(s) | Priority |
|------|---------|----------|
| Required field validation | `scripts/pipeline/validators.ts` | High |
| Data normalization | `scripts/pipeline/normalizers.ts` | High |
| JSON generation wrapper | `scripts/pipeline/generators.ts` | Medium |
| CSV parsing | `scripts/pipeline/csv-reader.ts` | Medium |
| Pipeline orchestration | `scripts/pipeline/import-data.ts` | Medium |
| Post-import content validation | `scripts/pipeline/update-site.ts` | Low |

### Data Loaders

| Area | File(s) | Priority |
|------|---------|----------|
| Product queries | `src/data/products.ts` | High |
| Collection queries | `src/data/collections.ts` | High |
| Form queries | `src/data/forms.ts` | Medium |

### Doctor Framework

| Area | File(s) | Priority |
|------|---------|----------|
| Health score calculation | `scripts/doctor/scoring.ts` | High |
| Business health analysis | `scripts/doctor/business.ts` | High |
| Check registration system | `scripts/doctor/registry.ts` | Medium |
| Config sheet parser | `scripts/doctor/doctor-config.reader.ts` | Low |
| All health checks | `scripts/doctor/checks/*.check.ts` | Medium |
| All reporters | `scripts/doctor/reporters/*.reporter.ts` | Low |

---

## What NOT To Test

- Astro framework internals
- TypeScript compiler behavior
- Node.js built-in APIs (fs, path, child_process)
- CSV parsing libraries
- Google APIs (sheets, drive, search console, analytics)
- Third-party packages
- HTML/CSS rendering (visual regression is future scope)
- Browser-specific behavior (future scope)

---

## Framework Choice

**Node.js built-in test runner** (`node:test` + `node:assert`).

Rationale:

- Zero additional dependencies — the project already uses `--experimental-strip-types`.
- Mature and stable since Node 20.
- No separate test config file required.
- Simple assertion API with `assert.deepEqual`, `assert.strictEqual`, `assert.throws`.
- Built-in coverage support via `--experimental-test-coverage`.
- The existing project is already structured for this approach: `node --experimental-strip-types scripts/doctor/doctor.ts`.

If mocking is needed (e.g., to simulate Google Sheets responses or file system states), use the existing **dependency-injection** patterns already present in the codebase rather than a mocking library. For example:
- The reader factory (`reader.ts`) already swaps between CSV and Sheets modes via environment variable.
- The submission provider (`submission.ts`) already selects between mock and real providers.
- Functions that read files should accept an optional file path parameter with a default.

---

## Test Folder Layout

```
tests/
  fixtures/            Test CSV and JSON data files (populated in v1.19.2+)
    collections/
      valid.csv
      missing-fields.csv
      empty.csv
    products/
      valid.csv
      missing-fields.csv
      inactive.csv
    forms/
      valid.csv
      row-per-field.csv
      json-field.csv
    data/
      products.json
      collections.json
      forms.json
  business/             Business logic tests (src/utils/*, src/data/*) [v1.19.2]
  pipeline/             Pipeline stage tests (scripts/pipeline/*) [v1.19.3]
  doctor/               Doctor framework tests (scripts/doctor/*) [v1.19.4]
  data/                 Data loader tests (src/data/*) [v1.19.2]
    framework.test.ts   Framework validation test (v1.19.1)
```

---

## Test Categories

### Unit Tests (`.test.ts`)

Test pure functions with isolated inputs and expected outputs.

**Examples:**
- `normalizeId('Hello World')` → `'hello-world'`
- `parseBoolean('yes')` → `true`
- `getPurchaseState({ active: true, price: null })` → `'coming-soon'`
- `calculateScore([{ status: 'FAIL' }, { status: 'PASS' }])` → `85`

No file I/O, no network. All inputs are passed as parameters. All outputs are return values.

### Integration Tests (`.test.ts`)

Test pipeline stages with fixture CSV files and verify generated output shape.

**Examples:**
- `validateRecords('products', [csv records])` rejects records with missing required fields.
- `normalizeProducts([csv records])` maps fields correctly.
- `createOrderFromCart(cart)` produces correct `Order` structure.

These tests read from `tests/fixtures/` and may use temporary files. They never write to `src/content/`.

### Doctor Tests (`.test.ts`)

Test Doctor-specific logic that does not require Google API access.

**Examples:**
- `calculateScore` with known pass/fail/warn counts
- `buildHealthScore` deduplicates recommendations
- `analyzeProducts` with controlled input arrays
- `computeMetrics` produces correct aggregations

### Future: UI Smoke Tests

If justified, add a single Astro page smoke test using Node's capability to render pages in a build context. Do not add browser testing unless there is a specific regression that requires it.

---

## Naming Conventions

- **Test files:** `<module-name>.test.ts` (e.g., `normalizers.test.ts`, `purchase-state.test.ts`)
- **Test suites:** `describe('<module or function name>')`
- **Test cases:** `it('<should do something when condition>')` or `it('<behavior description>')`
- **Fixture files:** Semantic names that describe the scenario: `valid.csv`, `missing-fields.csv`, `inactive-products.json`

---

## Test Data / Fixtures

All test fixtures live in `tests/fixtures/` and are version-controlled.

**Types of fixtures:**
- Hand-crafted CSV files matching the pipeline's expected input format
- Hand-crafted JSON files matching the generated `src/content/*.json` format
- Inline fixture objects for unit tests (preferred when the data is small)

**Rules:**
- Fixtures must be small (3-5 records maximum)
- Fixtures should represent realistic but minimal data
- Fixtures never contain real customer data or secrets
- Fixtures never require network access

---

## Running Tests

```bash
# Run all tests
npm run test

# Run with coverage (future milestone)
npm run test:coverage
```

Tests run directly with Node's built-in test runner: `node --experimental-strip-types --test tests/**/*.test.ts`

No build step, no config file, no test framework installation.

---

## Implementation Milestones

### v1.19.1 — Testing Foundation ✅ Complete

**Goal:** Establish test infrastructure, runner, fixtures, and first test.

**Scope:**
- Create `tests/` folder structure (business/, pipeline/, doctor/, data/, fixtures/)
- Add `npm run test` script (runs `node --experimental-strip-types --test tests/**/*.test.ts`)
- Write framework validation test (`tests/data/framework.test.ts`)
- Update documentation (this file + ARCHITECTURE.md + AGENTS.md)

**Outcome:** `npm run test` succeeds (3/3 tests). Production build unchanged. Ready for v1.19.2.

**Test file:**
- `tests/data/framework.test.ts` — validates node:test, async support, and TypeScript execution

### v1.19.2 — Business Logic Tests

**Goal:** Cover all high-priority business logic.

**Scope:**
- `purchase-state.ts` — all three states with boundary cases
- `order.ts` — order creation, price validation, sanitization
- `cart.ts` — add/remove/update, empty/invalid storage
- `format.ts` — price formatting, label formatting, status formatting
- `products.ts` — all query functions with fixture data
- `collections.ts` — all query functions with fixture data

**Outcome:** 80%+ of business logic has test coverage. Regressions in cart/order flows are caught.

### v1.19.3 — Pipeline Integration Tests

**Goal:** Protect pipeline data transformation stages.

**Scope:**
- `validators.ts` — required field detection for all three datasets
- `normalizers.ts` — each normalizer output shape and edge cases
- `generators.ts` — sortById, createGeneratedJson, writeGeneratedJson
- `csv-reader.ts` — quoted fields, empty lines, BOM handling, missing files
- Integration: validate → normalize → generate cycle with fixture CSVs

**Outcome:** Pipeline changes are safe. Broken transformations produce test failures.

### v1.19.4 — Doctor Regression Tests

**Goal:** Protect Doctor health scoring and business analysis.

**Scope:**
- `scoring.ts` — calculateScore, getStatus, collectRecommendations, buildHealthScore
- `business.ts` — analyzeProducts, computeMetrics, formCoverage, recommendations
- `registry.ts` — register, get, clear lifecycle
- Doctor checks: at least one check per check file exercised with known inputs

**Outcome:** Doctor scoring and analysis logic is regression-proofed.

### v1.19.5 — CI Integration ✅ Complete

**Goal:** Run tests automatically on push and PR.

**Scope:**
- Add `npm run test` to deploy workflow (`.github/workflows/deploy.yml`) — blocks deployment on test failure
- Create CI workflow (`.github/workflows/ci.yml`) — triggers on push (non-master branches) and pull requests
- CI runs: `npm ci` → `npm run test` → `npm run build`; test or build failure fails the workflow
- No secrets, no `.env`, no pipeline execution in CI
- Documentation updated

**Outcome:** Every push and PR runs the test suite. Broken code cannot reach production.

**Workflows:**

| Workflow | Trigger | Steps | Secrets |
|----------|---------|-------|---------|
| `deploy.yml` | push to master, schedule, manual | ci → test → update → deploy | Yes |
| `ci.yml` | push (non-master), pull_request | ci → test → build | No |
