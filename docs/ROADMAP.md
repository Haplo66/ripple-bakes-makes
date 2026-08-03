# RIPPLE Bakes & Makes — Project Roadmap

## Project Overview

RIPPLE Bakes & Makes is a premium artisan small business website for handmade bakery and sewing products.

### Purpose

- Present a beautiful, trustworthy product catalog for two business areas: Bakery and Sewing
- Provide a simple maintenance workflow where the owner manages content in Google Workspace and runs a single command to update the website
- Build toward a complete small business platform with ordering, notifications, and operations

### Core Goals

- Minimal technical maintenance for the business owner
- Owner-managed updates through Google Workspace
- Google Workspace as the single source of truth for all content
- Static site architecture — fast, secure, free to host
- No paid services, no backend, no database servers

### Stack

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| Static Site | Astro 6 | SSG, routing, components |
| Business Data | Google Sheets | Products, collections, forms |
| Business Assets | Google Drive | Product images, branding, banners, favicon |
| Deployment | GitHub Pages | Free static hosting |
| Language | TypeScript | All pipeline and site code |

---

## Architecture Evolution

### v1.0 — Foundation

**Goal:** Establish the static website and deployment pipeline.

Major capabilities added:
- Astro static site with Bakery and Sewing business areas
- GitHub Pages deployment with custom domain support
- Initial page structure (homepage, about, contact, business area pages)

Why it mattered: Provided the base technical foundation. Everything else builds on this.

---

### v1.5 — Data-Driven Architecture

**Goal:** Move from hardcoded content to data-driven pages.

Major capabilities added:
- Google Sheets as the primary data source for products and collections
- CSV file fallback for development without network access
- Import pipeline with data normalization and validation
- Dynamic page generation — adding a product to Sheets creates a page automatically

Why it mattered: Eliminated manual HTML editing. A product can now be added entirely through Sheets without touching code.

---

### v1.6 — Branding

**Goal:** Establish a visual identity for RIPPLE.

Major capabilities added:
- Logo system with responsive variants
- Favicon and browser tab branding
- Header and footer with consistent brand presentation
- Color palette and typography aligned with the artisan feel

Why it mattered: Moved from generic templates to a branded, professional presentation that reflects the handmade nature of the business.

---

### v1.7 — Product Configuration

**Goal:** Support customizable products with forms and options.

Major capabilities added:
- Product option system (sizes, colors, custom fields)
- Dynamic form generation based on product type
- Order-ready form data model

Why it mattered: Bakery and Sewing products have very different customization needs. This enabled a single architecture to handle both without per-product code.

---

### v1.8 — Google Sheets Integration Maturity

**Goal:** Make Sheets a reliable production data source.

Major capabilities added:
- Structured sheet schema with validation rules
- Multi-sheet support (products, collections, forms, options)
- Warning system for data quality issues
- Production-ready reader with error handling

Why it mattered: Sheets is now the authoritative business database. Data quality warnings prevent subtle website issues before they reach customers.

---

### v1.9 — Product Experience

**Goal:** Create a compelling product browsing and discovery experience.

Major capabilities added:
- Product detail pages with image galleries
- Collection-based browsing and navigation
- Featured products and homepage curation
- Image fallback hierarchy (product → collection → business area → placeholder)
- Enquiry-based customer flow instead of direct checkout

Why it mattered: Moved RIPPLE from a static catalog into a scalable product platform. Each product now has a full presentation layer, and the image system handles missing assets gracefully.

---

### v1.10 — Unified Business Asset Pipeline

**Goal:** Connect Google Drive as the business asset database and unify the entire update workflow into one command.

Major capabilities added:
- Google Drive authentication and API integration
- Asset synchronization across six asset areas (product images, collection images, homepage images, business area images, logo, favicon)
- Product ID-based image discovery that ignores human-readable folder names
- MD5 checksum comparison for safe incremental downloads
- Automatic repair of extensionless image files in Drive
- Single `npm run update` command that runs the complete pipeline

Why it mattered: Previously the owner had to run multiple technical commands in sequence. Now they manage content in Sheets and Drive, run one command, and the website is fully updated. This is the workflow the business will use going forward.

---

### v1.12 — Ordering Workflow ✅ Complete

**Goal:** Add a complete customer ordering workflow while keeping Google Workspace as the business operation center.

**Customer Ordering Flow:**
- Product browsing, customization, and cart functionality
- Checkout workflow supporting multi-product orders with quantity handling
- Order submission with retry handling and cart preservation on failure
- Mock submission provider retained for development

**Google Workspace Order Backend:**
- Google Apps Script Web App endpoint with token validation
- Order ID generation (RIP-YYYYMMDD-###)
- Orders Sheet and Order Items Sheet integration
- Email notifications with full product and customization details

**Order Data Improvements:**
- Product ID, name, collection, and quantity preserved
- Unit price captured at add-to-cart time (not hardcoded)
- Line total and order total computed server-side
- Product customization options stored with cleaned configuration keys
- Customer information (name, email, phone, pickup date, notes)
- Order status tracking managed in Google Sheets
- Owner-readable configuration (no {productId}-- prefix in keys)

**Google Workspace integration:**
- Orders workflow integrated with the existing Google Drive organization
- Owner manages orders through Google Sheets
- Website sends orders to Google Workspace
- No website database or backend server required

**Architecture decisions:**
- Order flow: Website → Google Apps Script → Google Sheets
- Existing content pipeline remains unchanged: Google Sheets → Astro Content Pipeline
- Orders are operational data and are intentionally not imported back into Astro
- Product/catalog management and order management remain separate systems
- Pricing comes from the product data at build time, captured at add-to-cart time
- Configuration keys are cleaned before storage: {productId}-- prefix is stripped server-side

**Business configuration stored separately:**
- Notification email address
- Shared token for endpoint validation
- Google Sheet identifiers
- Sheet names for Orders and Order Items

Why it mattered: Browse → Customize → Add to Cart → Checkout → Owner Notification → Order Management. RIPPLE now supports the complete customer ordering journey while allowing the owner to operate through Google Workspace without touching code.

---

### v1.12.1 — Unified Product Form System ✅ Complete

**Goal:** Replace the duplicated Product Options system with the Forms system as the single source of truth for all product customization.

**Completed capabilities:**
- Forms sheet becomes the single source of customization definitions
- Row-per-field structure (Form ID, Field Name, Field Type, Values, Required)
- Product Form ID controls which form is rendered on the product page
- Support for both new row-based and legacy JSON-blob form formats during migration
- Product Options dependency fully removed
- Universal customer comments field on every product
- Dynamic "Other" option handling with inline text input
- Dropdown and Textbox field types supported
- Products without a Form ID display comments and quantity only

**Migration approach:**
- Pipeline supports both formats for backward compatibility
- Product Options sheet is no longer read by the pipeline
- Legacy generated data preserved until the next pipeline run
- Existing cart and checkout workflow unchanged

**Why it mattered:** The owner manages all customization options from Google Sheets. New customizable products require no code changes. Simpler and more maintainable product management.

---

## Current Architecture

### Content Pipeline (Product Data)

```
Google Sheets                     Google Drive
  Products                          Product Images
  Collections                       Collection Images
  Forms                             Homepage Images
                                    Business Area Images
                                    Logo and Symbol
                                    Favicon
       │                                  │
       └──────────┬───────────────────────┘
                  │
                  ▼
         RIPPLE Content Pipeline
                  │
          Import: Data
          Import: Assets
                  │
                  ▼
         Validate Content
                  │
                  ▼
           Astro Build
                  │
                  ▼
          GitHub Pages
```

### Submission Pipeline (Operational Data)

```
Customer Browser
        │
        ├── Astro Website (Cart → Checkout)
        │           │
        │           ▼
        │   Google Apps Script Web App
        │           │
        │           ├── Orders Sheet
        │           ├── Order Items Sheet
        │           └── Email Notification
        │
        └── Astro Website (Contact Form)
                    │
                    ▼
            Google Apps Script Web App
                    │
                    ├── Inquiries Sheet
                    └── Email Notification
```

### Sheets vs Drive Responsibility

| Content Type | Source | Target |
|-------------|--------|--------|
| Products | Google Sheets | Generated JSON |
| Collections | Google Sheets | Generated JSON |
| Forms | Google Sheets | Generated JSON |
| Product Images | Google Drive | `public/images/products/{BA}/{Collection}/{Product Name}/` |
| Collection Images | Google Drive | `public/images/collections/{BA}/{Collection Name}/` |
| Homepage Images | Google Drive | `public/images/home/` |
| Business Area Images | Google Drive | `public/images/business-areas/{BA Name}/` |
| Logo | Google Drive | `public/images/logo/` |
| Favicon | Google Drive | `public/` |

### The Update Command

`npm run update` executes six steps in sequence:

1. **Validate environment** — check required configuration
2. **Normalize Drive assets** — repair known asset formatting issues before import
3. **Import Drive assets** — sync all asset areas from Drive
4. **Import Sheets data** — read and normalize all business data
5. **Validate generated content** — check for missing images, empty datasets
6. **Build Astro site** — generate the static website

### Key Architecture Decisions

- **Images are discovered by folder hierarchy.** The importer preserves the Drive folder structure (Business Area → Collection → Product) under `public/images/`. The image resolver scans the hierarchy dynamically and supports legacy flat/code-based paths as fallbacks for backward compatibility.
- **Sheets and Drive are independent sources.** The data pipeline and asset pipeline run separately. This means an owner can update products without touching images, or add images without touching data.
- **MD5 checksums prevent redundant downloads.** Only files whose content has changed are downloaded. The pipeline is safe to run repeatedly.
- **Read-only by default.** The asset importer uses read-only Drive credentials. Write access is isolated to the extension-repair utility with its own credentials.
- **No hardcoded business catalog content.** Products, collections, and operational content come from Google Workspace. Only technical defaults and presentation assets remain in code.
- **Images are a filesystem contract.** The pipeline writes to `public/images/` and the existing Astro image system reads from there. Astro does not know images came from Drive.
- **Two independent featured flags.** `homepageFeatured` controls which products appear on the homepage. `featured` controls which products are highlighted within collections and business area pages.
- **Orders are separate from product data.** Product data flows Sheets → Pipeline → Website. Orders flow Website → Apps Script → Sheets. They never cross. This keeps product updates (which require a rebuild) independent from incoming orders (which are real-time and must not require a rebuild).
- **Pricing is sourced from product data at build time.** Price comes from the Product model and is captured into the cart at add-to-cart time. It is not hardcoded, re-fetched, or computed on the server side.
- **Configuration keys are cleaned before storage.** The `{productId}--` prefix used internally is stripped in `createOrderFromCart()` so the stored JSON and email display use only the human-readable option names.

---

## Completed Milestones

### v1.0 — Foundation ✅

Includes:
- Astro static site with Bakery and Sewing sections
- GitHub Pages deployment configuration
- Initial page architecture (homepage, about, contact, business areas)
- Base CSS and responsive layout

### v1.5 — Content Data Pipeline ✅

Includes:
- Google Sheets as primary data source
- CSV file fallback for development
- Data import, normalization, and validation pipeline
- Dynamic product and collection page generation
- Warning system for data quality

### v1.6 — RIPPLE Branding ✅

Includes:
- Full logo system with responsive variants
- Favicon and browser tab assets
- Branded header and footer
- Typography and color system aligned with artisan identity

### v1.7 — Product Configuration ✅

Includes:
- Product option system for customisable items
- Dynamic form generation from sheet data
- Support for different form types (bread, filled pockets, custom shirts)
- Order-ready data model

### v1.8 — Google Sheets Integration Maturity ✅

Includes:
- Production Google Sheets reader
- Multi-sheet support
- Data validation and warning system
- Reliable business data import workflow

### v1.9 — Product Experience ✅

Includes:
- Product detail pages with image galleries
- Collection-based browsing
- Featured products and homepage curation
- Image fallback hierarchy (product → collection → business area → default)
- Inquiry-based customer flow

### v1.10 — Unified Business Asset Pipeline ✅

Includes:
- Google Drive API integration with service account authentication
- Asset import across all six asset areas
- Product ID-based image discovery
- Human-readable folder support
- MD5 checksum syncing
- Automatic extension repair for uploaded files
- Single `npm run update` command
- Business workflow documentation for the owner

### v1.12 — Ordering Workflow ✅

Includes:
- Customer cart and checkout connected to real order submission
- Google Apps Script Web App endpoint with token validation
- Orders stored in Google Sheets with status tracking
- Order Items sheet supporting multiple products per order
- Pricing preserved (unit price, line total, order total)
- Configuration keys cleaned ({productId}-- prefix stripped)
- Email notifications with full customization details and pricing
- Async submission with loading state and error handling
- Cart preserved on failure, cleared only on success
- Retry support for failed submissions
- Mock provider retained for development
- Complete order workflow documentation

### v1.12.1 — Unified Product Form System ✅

Includes:
- Forms sheet as the single customization source
- Row-per-field structure for simpler management
- Product Form ID selects dynamic forms on product pages
- Backward-compatible importer supporting both row-based and legacy JSON-blob formats
- Product Options system fully removed
- Universal Comments field for every product
- Dynamic "Other" dropdown support with inline text input
- Dropdown and Textbox field types supported
- Products without a Form ID display comments and quantity only
- Existing cart and checkout workflow unchanged

### v1.16 — Asset Hierarchy Consolidation ✅

**Goal:** Normalise Drive asset hierarchy so local file paths match Drive folder structure using display names.

**Drive Migration:**
- Collection Images restructured: `{BA Name}/{Collection Name}/` (Bakery/Sewing subfolders)
- Business Area Images restructured: flat files in `{BA Name}/` folders
- Logo and Symbol images moved from Collection Images to appropriate BA asset folders
- BA duplicate folders (BK → Bakery, SW → Sewing) merged

**Pipeline Updates:**
- `importBusinessAreaImages()`: saves to `business-areas/{displayName}/` (post-migration) or `business-areas/{code}/` (legacy fallback)
- `importCollectionImages()`: saves to `collections/{BA}/{Collection Name}/` preserving Drive hierarchy
- `importProductImages()`: detects BA parent folders and preserves the full hierarchy as `products/{BA}/{Collection}/{Product Name}/`
- `image-resolver.ts`: resolves BA-subfolder paths for all asset types with flat/code fallbacks
- Backward compatible — pre-migration flat folder structure still supported

**Asset Tools:**
- `cleanup-assets.ts`: BA duplicate folder merge, Collection Images hierarchy restructure, missing folder creation
- `asset-validator.ts`: Sheets-driven validation with JSON report

### v1.18 — Doctor / Health Monitoring System ✅

Includes:
- Doctor framework with modular check system
- Website health validation (19 checks, file/asset/pipeline/configuration verification)
- Business health scoring (catalog completeness, image coverage, form coverage)
- Owner report generation (JSON, Markdown, owner format, HTML email)
- Doctor dashboard page at `/doctor`
- Email delivery workflow via Apps Script with HTML formatting
- Doctor Config sheet controls
- GitHub Actions automation
- Google Search Console integration (impressions, clicks, position, indexed pages)
- Google Analytics 4 integration (users, page views, engagement, top page)
- 74 regression tests across scoring, business analysis, and registry modules
- CI test isolation fix — importing scoring functions does not trigger Doctor runtime execution

### v1.19 — Automated Testing Suite ✅

Includes:
- Node.js built-in test runner (`node:test` + `node:assert`) — zero dependencies
- 233 tests across business logic (58), pipeline (101), and Doctor (74) modules
- Test structure mirrors source under `tests/`
- Inline data arrays — no IO, fully deterministic
- Tests never write to `src/content/`, call Google APIs, or require `.env`
- CI workflow (ci.yml): tests run on push (non-master) and PR — no secrets required
- Deploy workflow: `npm run test` blocks deployment on failure

### v1.20.0 — Maintenance

**Status: Completed**

**Completed:**
- Resolve Astro type checking issues
- Restore clean development checks
- `npx astro check` passes with 0 errors and 0 warnings across all Astro and TypeScript files
- Added explicit element types, safe null handling, and type guards to untyped client scripts in `.astro` components
- Fixed TypeScript diagnostics in Doctor reporters, Drive importer scripts, pipeline utilities, and test files

### v1.20.1 — Customer Order Experience Polish

**Status: Completed**

**Completed:**
- Phone validation utility
- Checkout phone validation
- Inquiry phone validation
- Optional pickup time
- Checkout review step
- Order item summary
- Customer recap
- Order total confirmation
- Cart preservation on submission failure
- Automated tests
- Documentation updates

### v1.20.2 — Customer Experience Follow-up

**Status: Completed**

**Completed:**
- Product pages display Availability, Preparation Time, and Fulfillment
- New `availability`, `preparationTime`, and `fulfillment` columns flow from Google Sheets through the import pipeline to the product page
- Fulfillment values generate customer-friendly copy (Pickup Only / Shipping Available / Pickup or Shipping)
- Preferred Contact Method is now optional on the checkout form
- Checkout review shows "Not specified" when no contact preference is chosen
- Availability / Status separation — `availability` is customer-facing fulfillment information while `status` controls ordering
- Coming Soon experience for unavailable products — inactive products remain visible and display a Coming Soon badge
- Customer-facing product messaging — "This product is currently unavailable." message shown for non-orderable products
- Purchase-state handling for inactive products — inactive status products can never be added to cart or ordered
- Automated tests

### v1.20.3 — Gallery & Storytelling Enhancement

**Status: In Progress**

**Completed:**
- Gallery cards keep an image-first design with no text overlaid on images
- Cards show Product Name, a short product story, and a View Product link below the image
- Image popup / lightbox preserved and enhanced with Product Name, story, and a View Product link (no text over the image)
- Gallery captions reuse existing product information — no duplicate descriptions
- Story source priority: Product Description → Short Description → Product Name fallback
- Gallery images resolve to products by Product Name (no owner-managed IDs) — Product Name → Product ID → product page link → product description
- Owner continues to manage business concepts (Product Name, Collection, Category) in Google Sheets; technical identifiers stay internal
- Automated tests for gallery story resolution and product linking

---

### v1.20.4 — Automatic Product ID Generation

**Status: Complete**

**Completed:**
- The owner no longer fills in Product IDs when adding products — the pipeline auto-generates them as `{Business}-{Collection}-{Number}` (e.g. `BK-CA-001`)
- New `scripts/pipeline/product-ids.ts` resolves a collection's 2-letter code from the Collections sheet, then computes the next free sequence number across all products
- New `scripts/pipeline/sheets-writer.ts` writes generated IDs back to the Products worksheet so Google Sheets stays the source of truth
- `Collection Code` column added to the Collections schema (recommended; code is derived from existing product IDs when blank)
- Product ID is no longer a required field — validation now requires only `businessArea`, `collection`, and `name`
- Existing Product IDs are never modified or reused; un-generatable rows are skipped with a clear warning
- Added tests for generation, sequencing, reuse protection, code fallback, and failure warnings
- `--preview` mode reads live data and reports exactly which IDs would be written, without touching the sheet or files
- Verified end-to-end: `Product ID` column added to the live Products sheet, 20 generated IDs written back, all 20 match the website's internal IDs, and `npm run update` (Drive + Sheets + build) completes with 42 pages

**Why it mattered:** Product IDs are a technical detail. Automating them removes a source of owner error and keeps internal references (image folders, collection codes) consistent without manual spreadsheet bookkeeping.

---

## Current Status

**Version: v1.20.4**

### What Works Today

**Content Pipeline**
- Google Sheets manages all structured business data: products, collections, and forms
- Google Drive manages all business assets: product images, collection images, business area images, homepage images, logo, and favicon
- `npm run update` synchronises both sources and rebuilds the website in a single command
- Data quality warnings catch missing fields before they reach production
- Product IDs are auto-generated for new products (`{Business}-{Collection}-{Number}`) and written back to the sheet — no manual ID bookkeeping
- Forms sheet uses row-per-field structure for simpler management
- Product pages show Availability, Preparation Time, and Fulfillment copy from the Products sheet

**Ordering Workflow**
- Customers can browse, customize, add to cart, and submit orders
- Phone numbers validated on the order and inquiry forms (international numbers supported)
- Preferred Contact Method is optional — customers can order without choosing a contact preference
- Preferred Pickup Date is optional — customers can order without choosing a date
- Checkout review step shows every item (quantity, options, unit price, line total) and a prominent Order Total before submission
- Orders are sent to Google Apps Script which writes to Google Sheets
- Owner receives email notification for every new order with pricing details
- Order status managed directly in Google Sheets (Received → Confirmed → Preparing → Ready → Completed)
- Product customizations preserved in the Order Items sheet with cleaned configuration keys
- Pricing captured at add-to-cart time: unit price, line total, and order total stored in sheets

**Image System**
- Drive hierarchy uses Business Area display names as folder layers (`Bakery/`, `Sewing/`)
- Local `public/images/` mirrors Drive hierarchy with BA display name subfolders
- Product-level images: `public/images/products/{BA}/{Collection}/{Product Name}/`
- Collection-level images: `public/images/collections/{BA}/{Collection Name}/`
- Business-area-level images: `public/images/business-areas/{BA Name}/`
- Fallback hierarchy: product → collection → business area → default placeholder
- Backward compatible — flat/code-based legacy paths still resolved as fallbacks
- MD5 checksums prevent redundant downloads — unchanged files are skipped

**Gallery & Storytelling**
- Gallery cards show the image first with no text overlay, then Product Name, a short product story, and a View Product link
- Product stories reuse existing product copy (Product Description → Short Description → Product Name) — no duplicate captions
- Gallery images link to products by Product Name resolution (Product Name → Product ID → product page), keeping technical IDs internal
- Lightbox popup shows the larger image plus Product Name, story, and a View Product link
- Collection items link to their collection page; personal items display title only
- `galleryFeatured` controls which products appear in the gallery (defaults to `true`)

**Featured Logic**
- `homepageFeatured` controls which products appear on the homepage
- `featured` controls which products are highlighted within collections and business area pages
- The two flags operate independently

**Contact Inquiry Workflow**
- Contact form with topic dropdown (7 options), preferred contact, and message
- Submission sent to the same Apps Script endpoint as orders
- Inquiries sheet receives every submission with full details
- Email notification to owner for every inquiry
- Loading, success, and error UI states implemented
- Mock submission for development (no endpoint configured)

**Website**
- 20 products across Bakery and Sewing managed through Google Sheets
- 13 collections with dynamic pages for each
- Cart and checkout pages with real order submission
- Contact page with working inquiry form and backend integration
- Static Astro site deployed on GitHub Pages

**Doctor Health Monitoring**
- Website health scoring (19 checks, 95/100)
- Business health scoring (catalog completeness)
- Owner-facing reports (Markdown, JSON, owner format)
- Dashboard at /doctor
- Email delivery of health reports
- Google Search Console and Analytics 4 integration
- Doctor Config sheet controls

**Testing Suite**
- 314 automated tests across business logic, pipeline, and Doctor modules
- Node.js built-in test runner — zero additional dependencies
- CI integration: tests run automatically on push and PR
- Test failure blocks deployment

**Publishing Workflow**
- Owner can publish updates from the browser via GitHub Actions manual trigger
- `npm run update` runs the full data import, validation, and build pipeline
- `push` to `master` also runs the full pipeline
- Failed updates stop before deployment — existing site remains live
- CI validation gates deployment

### Owner Workflow

**Product and Content Management**
1. Add or update products in Google Sheets
2. Add or change images in Google Drive
3. **Option A:** Run `npm run update` locally (developer machine)
4. **Option B:** Go to GitHub → Actions → Run workflow (any browser)
5. Website is updated with latest data and assets

**Order Management**
1. Receive email notification for new orders with itemised pricing
2. View order details, customizations, and pricing in Google Sheets
3. Update order status as it progresses
4. Communicate with customer to arrange pickup

**Inquiry Management**
1. Receive email notification for new inquiries
2. View inquiry details and topic in the Inquiries sheet
3. Respond to the customer via their preferred contact method
4. Update inquiry status as needed (New → In Progress → Resolved)

### Known Small Improvements

- Validation reports during `npm run update` could be more actionable for non-technical users.

---

### v1.14 — Sheets Publish Button ✅ Verified

**Test date:** July 26, 2026

**Goal:** Allow the owner to publish website updates directly from Google Sheets.

**Implemented:**
- Custom menu "RIPPLE Website → Publish Website" in the content spreadsheet
- Google Apps Script bound to the content sheet calls the GitHub Actions API
- GitHub Personal Access Token stored securely via Apps Script Script Properties
- Triggers the existing `workflow_dispatch` on `deploy.yml`
- Emergency fallback: GitHub Actions manual trigger remains available
- Documentation and setup instructions in `docs/ORDER_WORKFLOW.md`

**End-to-end verification:**
- Google Sheets Publish Website button tested successfully
- Google Apps Script successfully called GitHub Actions `workflow_dispatch` API
- GitHub Actions build job completed successfully
- Existing `npm run update` pipeline executed successfully:
  - Environment validation
  - Google Drive asset repair
  - Google Drive asset import
  - Google Sheets data import
  - Astro static build
- GitHub Pages deploy job completed successfully
- Website deployment verified

**Architecture:**

```
Google Sheets
  ↓
Apps Script (bound to sheet)
  ↓
GitHub Actions API (workflow_dispatch)
  ↓
Existing deploy workflow (npm run update)
  ↓
GitHub Pages
```

---

### v1.15 — Contact Inquiry Workflow ✅

**Goal:** Add a complete contact inquiry workflow that integrates with the existing Google Apps Script backend.

**Completed:**
- Contact form with polished UI (topic dropdown, preferred contact, name, email, phone, message)
- Form validation and submission UX (loading, success, error states)
- Shared endpoint with orders: same `PUBLIC_SUBMISSION_ENDPOINT` serves both flows
- Apps Script routes payloads by type: `handleOrder()` for orders, `handleInquiry()` for inquiries
- Inquiries sheet with structured columns (inquiry ID, timestamp, status, name, email, phone, topic, preferred contact, message, source)
- Inquiry ID generation (`INQ-YYYYMMDD-###`)
- Email notification for every inquiry submission
- Mock submission for development (simulates success when no endpoint is configured)

**Environment consolidation:**
- `PUBLIC_ORDER_ENDPOINT` and `PUBLIC_INQUIRY_ENDPOINT` merged into single `PUBLIC_SUBMISSION_ENDPOINT`
- GitHub repository secret and all docs references updated

**Why it mattered:** Customers can now reach out with custom requests, questions, and feedback directly through the website. The owner receives organized inquiries in Google Sheets and email notifications — matching the same professional workflow as orders. The shared endpoint keeps maintenance simple.

---

### v1.17 — Gallery Experience

**Goal:** Create a curated visual showcase for RIPPLE that highlights craftsmanship, products, and behind-the-scenes work without turning the gallery into a duplicate product catalog.

**Architecture decision:** Use a hybrid gallery model — automatically reuse selected existing product and collection images, avoid displaying every product image, and allow future owner-added gallery-only images that do not require product or collection mapping.

#### v1.17.1 — Gallery Foundation

**Status:** Planned

**Scope:**
- Create Gallery page
- Build gallery from existing assets using the current image hierarchy (`products/{BA}/{Collection}/{Product}/`, `collections/{BA}/{Collection}/`)
- Curated product and collection image selection — not every image appears in the gallery
- Limit product image duplication across gallery views
- Category filtering: All, Bakery, Sewing
- Responsive gallery layout
- Image lightbox/viewer

**Constraints:**
- No new Drive gallery importer
- No changes to the existing asset pipeline
- Reuse existing image resolver logic

#### v1.17.2 — Personal Gallery

**Status:** Implemented

**Purpose:** Allow owner-managed storytelling images independent of products — behind-the-scenes baking, sewing process, workspace photos, events, seasonal creations, customer stories (future).

**Drive structure:**
```
Assets/
└── Gallery Images/
    ├── Personal/     → public/images/gallery/personal/
    ├── Bakery/       → public/images/gallery/bakery/
    └── Sewing/       → public/images/gallery/sewing/
```

**Implementation:**
- Dedicated `scripts/pipeline/drive-gallery-image-importer.ts` — standalone importer that scans `Assets/Gallery Images/` subfolders and downloads to `public/images/gallery/{category}/`
- Integrated into `update-site.ts` as Step 4 (before Sheets import so gallery-assets.json picks up new files)
- `import-data.ts` scans `public/images/gallery/personal/` and generates `src/content/gallery-assets.json`
- Gallery data layer (`src/utils/gallery.ts`) merges three sources: `getProductGalleryItems()`, `getCollectionGalleryItems()`, `getPersonalGalleryItems()`
- Gallery page filter bar: All | Bakery | Sewing | Personal
- Personal filter shows only manually uploaded gallery images (sourceType: 'personal')
- Gallery card labels: only [Business Area] badge ("Bakery" / "Sewing") for product and collection items; personal items show title only — no literal type badges are displayed
- `GalleryItem.sourceType` values: `'product' | 'collection' | 'personal'`
- Personal images are standalone — no product or collection mapping required
- Missing gallery folder does not fail build; empty folders allowed

**Design goals:**
- Simple folder management — no product ID mapping
- Owner can add images without changing product data


### v1.18 — Website Health & Insights / Doctor Framework ✅ Complete

**Goal:** Add a comprehensive health monitoring system that evaluates website technical health, business catalog completeness, and delivers owner-facing reports.

**Completed capabilities:**

**v1.18.1 — Doctor Framework Foundation:**
- Doctor framework with modular check system
- Website health validation (19 checks)
- Business health scoring (catalog completeness)
- Owner report generation (JSON, Markdown, owner format, email)
- Doctor dashboard page at `/doctor`
- Email delivery workflow via Apps Script with full HTML formatting
- Doctor Config sheet integration
- GitHub Actions automation

**v1.18.2 — Health Checks & Content Validation:**
- File and directory existence verification
- Product required field validation
- Cross-dataset reference validation (products → collections, products → forms)
- Active product image folder verification
- Image reference resolution checking
- Collection image presence checking
- Unused asset folder detection
- Pipeline script existence verification
- Generated data file validity checking
- Pipeline integration configuration checking
- Build input readiness checking
- Cross-dataset consistency checks

**v1.18.3 — Health Scoring & Recommendations:**
- CalculateScore: weighted deductions (WARN=5, FAIL=15)
- getStatus: GOOD/ATTENTION/CRITICAL thresholds
- collectRecommendations: case-insensitive deduplication
- buildHealthScore: unified score + status + recommendations
- buildSummary: PASS/WARN/FAIL/INFO counts
- Business health analysis (imageScore, analyzeProducts, computeMetrics, computeFormCoverage, calculateBusinessScore, generateRecommendations)

**v1.18.4 — Google Insights Integration:**
- Google Search Console: impressions, clicks, average position, indexed pages
- Google Analytics 4: users, page views, average engagement, top page
- Graceful degradation — missing data shows as "Unavailable"
- No health score impact for unavailable external data
- Visibility and Visitors sections in email report

**Validation:**
- 74 Doctor tests across registry, scoring, and business modules
- CI test isolation: importing scoring functions no longer triggers Doctor runtime execution
- `npm run doctor` delivers complete health report
- End-to-end email delivery verified

**Why it matters:** The owner now has automated visibility into website health, catalog completeness, search performance, and visitor activity — all delivered to their inbox without manual inspection.

#### v1.19 — Testing Framework ✅ Complete

**Goal:** Introduce a lightweight automated testing framework to protect RIPPLE business behavior, catch regressions, and make future features safer.

**Implementation milestones:**

- **v1.19.1 — Testing Foundation:** Establish test runner (`node:test`), create `tests/` structure and fixtures, add `npm run test` script, write framework validation test.
- **v1.19.2 — Business Logic Tests:** 58 tests covering purchase-state, order, cart, format, products loader, collections loader.
- **v1.19.3 — Pipeline Integration Tests:** 101 tests covering validators, normalizers, generators.
- **v1.19.4 — Doctor Regression Tests:** 74 tests covering scoring, business analysis, registry.
- **v1.19.5 — CI Integration:** Tests run automatically on push and PR via GitHub Actions; deploy workflow blocks on test failure.

**Key decisions:**
- Node.js built-in test runner — zero additional dependencies
- Tests mirror source structure under `tests/`
- Inline data arrays for unit tests — no IO, fully deterministic
- Tests never write to `src/content/`, call Google APIs, or require `.env`
- No mocking libraries — use existing DI patterns
- CI workflow (ci.yml) requires no secrets

**Validation:**
- 233 tests passing across all modules
- Build produces 40 pages cleanly
- Doctor health check at 95/100

**See:** [TESTING.md](./TESTING.md) for full architecture plan.

---

## v1.20 — Website Polish & Customer Experience

Status: 🚧 In Progress

### Overview

A customer experience refinement milestone focused on improving website clarity, trust, and ease of use.

This milestone improves how customers discover products, understand availability, place orders, and connect with RIPPLE creations while keeping the owner workflow simple and Google Sheets as the source of truth.

Delivered improvements include:

- Improved checkout review experience and validation
- Clear product availability and fulfillment messaging
- Better handling of unavailable products with Coming Soon states
- Gallery storytelling and product discovery improvements
- Continued separation between owner workflow and technical implementation details

v1.20.1 — Checkout & Forms
v1.20.2 — Customer Experience Follow-up
v1.20.3 — Gallery & Storytelling Enhancement
v1.20.4 — Automatic Product ID Generation

---

## Development Principles

- **Static Astro architecture.** No backend, no database servers, no runtime dependencies.
- **Google Workspace is the single source of truth.** All content originates in Sheets or Drive. Never edit generated files.
- **Clear separation of concerns.** Data (Sheets), assets (Drive), and presentation (Astro) are independent layers connected only by the pipeline.
- **Free solutions only.** The entire stack uses free tiers — GitHub Pages, Google Workspace, open-source tools.
- **Add complexity when needed, not before.** Every feature must justify its existence against the business need.
- **The owner should never touch code.** Every interaction with the website should be through Google Workspace or the `npm run update` command.
- **Publishing should not require a developer.** The owner must be able to publish updates independently.
- **The owner should only manage Google Workspace.** All content and configuration changes happen in Sheets or Drive.
- **Automation should execute the existing pipeline, not replace it.** The `npm run update` workflow is the source of truth.
- **Failed validation must never publish a broken website.** The validation gate is a hard safety boundary.

---

## Maintenance Rule

Update ROADMAP.md only when:
- A milestone is completed
- Project direction changes
- Major architecture decisions are made

Do not add implementation history, debugging notes, terminal output, bug fixes, file lists, or code snippets. Those belong in commit messages or technical documentation.

---

## Future Phase — Business Growth & Platform Maturity

**Goal:** Transform RIPPLE from a functional product website into a complete small business operating system.

### 1. Website Experience Improvements

**Business Area Page Improvements:**
- Stronger bakery and sewing landing pages
- Better product discovery
- Clear ordering expectations
- Business storytelling

**Product Experience Improvements:**
- Better descriptions
- Preparation/customization details
- Lead times
- Care instructions
- Bakery ingredients/allergen information
- Sewing material/care information

**SEO & Discoverability:**
- Metadata improvements
- Social sharing/OpenGraph
- Local business SEO
- Product structured data
- FAQ structured data

### 2. Business Operations Foundation

**Business Registration & Legal Setup:**
- Business structure research
- Business name registration
- EIN requirements
- Business banking
- Required permits/licenses
- Bakery-specific requirements
- Sewing-specific requirements

**Financial Operations:**
- Revenue tracking
- Expense tracking
- Material/ingredient cost tracking
- Equipment tracking
- Profit calculation
- Sustainable pricing model

**Marketing Foundation:**
- Google Business Profile
- Social media presence
- Behind-the-scenes content
- Customer stories
- Email list
- Local community marketing

### 3. Inquiry → Convert to Order

**Goal:** Allow the owner to convert an inquiry into an order directly from Google Sheets.

**Planned:**
- Copy inquiry data (name, email, phone, preferred contact) into a new Orders row
- Generate a new order ID (`RIP-YYYYMMDD-###`)
- Update the inquiry status to `Converted`
- Link the inquiry ID to the new order ID
- Trigger a notification to the customer

This is planned but not yet implemented.

### 4. Future Business Platform Expansion

Long-term possibility of expanding Google Workspace into a lightweight business operating system:

**Google Workspace:**
- Products
- Orders
- Customers
- Inventory
- Expenses
- Marketing
- Analytics

**Connected to:**
RIPPLE Website → Customers

**Principle:** Add complexity only when it directly supports business growth.

### 5. Future Dashboard Planning

**Doctor Dashboard / Business Command Center**

Purpose: Provide a visual owner dashboard combining:
- Website Health
- Business Health
- Product Inventory status
- Google Visibility trends
- Visitor trends

Possible future sections:
- Health score history
- Traffic trends
- Search growth
- Product/content improvement tracking
- Historical reports

**Constraints:**
- Keep Doctor as the data engine
- Dashboard should consume existing Doctor reports/data
- Do not create a separate analytics system


### **DEVELOPER NOTES - DO NOT REMOVE**
- test if replacing pictures - it will update in website
- wording and pages improvements
  - our story page + images
  - hero picture area
  - images getting cut (sizing issue?)
  - home page first sentence - wording and font
- Give every collection its own short introduction instead of jumping straight into products.
- when in cart, maybe ability to edit product, do it will go back to product page and "update" button will appear?
- review in import folder with csv files are needed
- email report got screwed up, and need to divide issues to sewing and bakery
