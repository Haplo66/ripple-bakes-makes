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
| Business Assets | Google Drive | Product images, branding, banners, favicon, gallery images |
| Deployment | GitHub Pages | Free static hosting |
| Language | TypeScript | All pipeline and site code |

---

## Completed Milestones

### v1.0 — Foundation ✅

**Goal:** Establish the static website and deployment pipeline.

Major capabilities added:
- Astro static site with Bakery and Sewing business areas
- GitHub Pages deployment with custom domain support
- Initial page structure (homepage, about, contact, business area pages)
- Base CSS and responsive layout

Why it mattered: Provided the base technical foundation. Everything else builds on this.

---

### v1.5 — Data-Driven Architecture ✅

**Goal:** Move from hardcoded content to data-driven pages.

Major capabilities added:
- Google Sheets as the primary data source for products and collections
- CSV file fallback for development without network access
- Import pipeline with data normalization and validation
- Dynamic page generation — adding a product to Sheets creates a page automatically

Why it mattered: Eliminated manual HTML editing. A product can now be added entirely through Sheets without touching code.

---

### v1.6 — Branding ✅

**Goal:** Establish a visual identity for RIPPLE.

Major capabilities added:
- Logo system with responsive variants
- Favicon and browser tab branding
- Header and footer with consistent brand presentation
- Color palette and typography aligned with the artisan feel

Why it mattered: Moved from generic templates to a branded, professional presentation that reflects the handmade nature of the business.

---

### v1.7 — Product Configuration ✅

**Goal:** Support customizable products with forms and options.

Major capabilities added:
- Product option system (sizes, colors, custom fields)
- Dynamic form generation based on product type
- Order-ready form data model
- Support for different form types (bread, filled pockets, custom shirts)

Why it mattered: Bakery and Sewing products have very different customization needs. This enabled a single architecture to handle both without per-product code.

---

### v1.8 — Google Sheets Integration Maturity ✅

**Goal:** Make Sheets a reliable production data source.

Major capabilities added:
- Structured sheet schema with validation rules
- Multi-sheet support (products, collections, forms, options)
- Warning system for data quality issues
- Production-ready reader with error handling

Why it mattered: Sheets is now the authoritative business database. Data quality warnings prevent subtle website issues before they reach customers.

---

### v1.9 — Product Experience ✅

**Goal:** Create a compelling product browsing and discovery experience.

Major capabilities added:
- Product detail pages with image galleries
- Collection-based browsing and navigation
- Featured products and homepage curation
- Image fallback hierarchy (product → collection → business area → placeholder)
- Enquiry-based customer flow instead of direct checkout

Why it mattered: Moved RIPPLE from a static catalog into a scalable product platform. Each product now has a full presentation layer, and the image system handles missing assets gracefully.

---

### v1.10 — Unified Business Asset Pipeline ✅

**Goal:** Connect Google Drive as the business asset database and unify the entire update workflow into one command.

Major capabilities added:
- Google Drive authentication and API integration
- Asset synchronization across six asset areas (product images, collection images, homepage images, business area images, logo, favicon)
- Product ID-based image discovery that ignores human-readable folder names
- MD5 checksum comparison for safe incremental downloads
- Automatic repair of extensionless image files in Drive
- Single `npm run update` command that runs the complete pipeline
- Human-readable folder support
- Business workflow documentation for the owner

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
- Complete order workflow documentation

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
- Existing cart and checkout workflow unchanged

**Migration approach:**
- Pipeline supports both formats for backward compatibility
- Product Options sheet is no longer read by the pipeline
- Legacy generated data preserved until the next pipeline run
- Existing cart and checkout workflow unchanged

Why it mattered: The owner manages all customization options from Google Sheets. New customizable products require no code changes. Simpler and more maintainable product management.

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

Why it mattered: Customers can now reach out with custom requests, questions, and feedback directly through the website. The owner receives organized inquiries in Google Sheets and email notifications — matching the same professional workflow as orders. The shared endpoint keeps maintenance simple.

---

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

---

### v1.17 — Gallery Experience

**Goal:** Create a curated visual showcase for RIPPLE that highlights craftsmanship, products, and behind-the-scenes work without turning the gallery into a duplicate product catalog.

**Architecture decision:** Use a hybrid gallery model — automatically reuse selected existing product and collection images, avoid displaying every product image, and allow future owner-added gallery-only images that do not require product or collection mapping.

#### v1.17.1 — Gallery Foundation ✅ Complete

**Scope implemented:**
- Gallery page with responsive layout
- Build gallery from existing assets using the current image hierarchy (`products/{BA}/{Collection}/{Product}/`, `collections/{BA}/{Collection}/`)
- Curated product and collection image selection — not every image appears in the gallery
- Limit product image duplication across gallery views
- Category filtering: All, Bakery, Sewing
- Image lightbox/viewer
- Gallery components: GalleryGrid, GalleryCard, GalleryFilter, Lightbox

**Initial constraints (superseded by v1.17.2):**
- No Drive gallery importer — reused existing asset pipeline
- No changes to the existing asset pipeline
- Reuse existing image resolver logic

#### v1.17.2 — Personal Gallery ✅ Implemented

**Purpose:** Allow owner-managed storytelling images independent of products — behind-the-scenes baking, sewing process, workspace photos, events, seasonal creations, customer stories (future).

**Drive structure:**
```
Assets/
└── Gallery Images/
    ├── Bakery/       → public/images/gallery/bakery/
    ├── Sewing/       → public/images/gallery/sewing/
    └── Personal/     → public/images/gallery/personal/
```

**Implementation:**
- Dedicated `scripts/pipeline/drive-gallery-image-importer.ts` — standalone importer that scans `Assets/Gallery Images/` subfolders and downloads to `public/images/gallery/{category}/`
- Integrated into `update-site.ts` as Step 4 (before Sheets import so gallery-assets.json picks up new files)
- `import-data.ts` scans `public/images/gallery/personal/` and generates `src/content/gallery-assets.json`
- Gallery data layer (`src/utils/gallery.ts`) merges three sources: `getProductGalleryItems()`, `getCollectionGalleryItems()`, `getPersonalGalleryItems()`
- Gallery page filter bar: All | Bakery | Sewing | Personal
- Personal filter shows only manually uploaded gallery images (sourceType: 'personal')
- Gallery card display: [Business Area] badge for product/collection items; personal items show title only — no literal type badges
- `GalleryItem.sourceType` values: `'product' | 'collection' | 'personal'`
- `GalleryItem.businessArea` typed as `'bakery' | 'sewing' | null` (null for personal items)
- Personal images are standalone — no product or collection mapping required
- Missing gallery folder does not fail build; empty folders allowed

**Design goals:**
- Simple folder management — no product ID mapping
- Owner can add images without changing product data

#### v1.17.3 — Gallery Enhancements [Planned]

**Potential improvements:**
- Homepage gallery preview
- Featured gallery images
- Seasonal collections
- Captions and stories
- Sheet-driven gallery management (beyond current Drive-folder approach)

---

## Current Architecture

### Content Pipeline

```
Google Sheets                                Google Drive
  Products                                    Product Images
  Collections                                 Collection Images
  Forms                                       Homepage Images
                                              Business Area Images
                                              Logo and Symbol
                                              Favicon
                                              Gallery Images (Bakery, Sewing, Personal)
       │                                             │
       └──────────┬──────────────────────────────────┘
                  │
                  ▼
         RIPPLE Content Pipeline
                  │
          Steps: 1. Validate environment
                 2. Normalize Drive assets
                 3. Import Drive assets
                 4. Import Gallery images
                 5. Import Sheets data
                 6. Validate generated content
                 7. Build Astro site
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
| Gallery Images | Google Drive | `public/images/gallery/{category}/` |
| Logo | Google Drive | `public/images/logo/` |
| Favicon | Google Drive | `public/` |

### The Update Command

`npm run update` executes seven steps in sequence:

1. **Validate environment** — check required configuration
2. **Normalize Drive assets** — repair known asset formatting issues before import
3. **Import Drive assets** — sync all asset areas from Drive
4. **Import Gallery images** — download gallery images from Drive subfolders (Bakery, Sewing, Personal)
5. **Import Sheets data** — read and normalize all business data
6. **Validate generated content** — check for missing images, empty datasets
7. **Build Astro site** — generate the static website

### Key Architecture Decisions

- **Images are discovered by folder hierarchy.** The importer preserves the Drive folder structure (Business Area → Collection → Product, or Gallery Category) under `public/images/`. The image resolver scans the hierarchy dynamically and supports legacy flat/code-based paths as fallbacks for backward compatibility.
- **Sheets and Drive are independent sources.** The data pipeline and asset pipeline run separately. This means an owner can update products without touching images, or add images without touching data.
- **MD5 checksums prevent redundant downloads.** Only files whose content has changed are downloaded. The pipeline is safe to run repeatedly.
- **Read-only by default.** The asset importer uses read-only Drive credentials. Write access is isolated to the extension-repair utility with its own credentials.
- **No hardcoded business catalog content.** Products, collections, and operational content come from Google Workspace. Only technical defaults and presentation assets remain in code.
- **Images are a filesystem contract.** The pipeline writes to `public/images/` and the existing Astro image system reads from there. Astro does not know images came from Drive.
- **Two independent featured flags.** `homepageFeatured` controls which products appear on the homepage. `featured` controls which products are highlighted within collections and business area pages.
- **Orders are separate from product data.** Product data flows Sheets → Pipeline → Website. Orders flow Website → Apps Script → Sheets. They never cross. This keeps product updates (which require a rebuild) independent from incoming orders (which are real-time and must not require a rebuild).
- **Pricing is sourced from product data at build time.** Price comes from the Product model and is captured into the cart at add-to-cart time. It is not hardcoded, re-fetched, or computed on the server side.
- **Configuration keys are cleaned before storage.** The `{productId}--` prefix used internally is stripped in `createOrderFromCart()` so the stored JSON and email display use only the human-readable option names.
- **Gallery is a hybrid model.** Product/collection images are reused from the existing hierarchy; personal gallery images come from a dedicated Drive importer. The three source types are merged at the data layer.

---

## Current Status

**Version: v1.17.2**

### What Works Today

**Content Pipeline**
- Google Sheets manages all structured business data: products, collections, and forms
- Google Drive manages all business assets: product images, collection images, business area images, homepage images, logo, favicon, and gallery images
- `npm run update` synchronises both sources and rebuilds the website in a single command
- Data quality warnings catch missing fields before they reach production
- Forms sheet uses row-per-field structure for simpler management

**Gallery**
- Dedicated gallery page with responsive grid layout and lightbox viewer
- Gallery draws from three sources: product images (featured flag), collection images, and personal gallery uploads
- Category filter: All | Bakery | Sewing | Personal
- Personal gallery images managed via Drive folder (`Assets/Gallery Images/Personal/`)
- Gallery images for Bakery and Sewing categories sourced from Drive (`Assets/Gallery Images/Bakery/`, `Assets/Gallery Images/Sewing/`)
- Gallery data layer merges all sources and resolves business area badges
- Missing gallery folders do not fail the build; empty folders allowed

**Ordering Workflow**
- Customers can browse, customize, add to cart, and submit orders
- Orders are sent to Google Apps Script which writes to Google Sheets
- Owner receives email notification for every new order with pricing details
- Order status managed directly in Google Sheets (Received → Confirmed → Preparing → Ready → Completed)
- Product customizations preserved in the Order Items sheet with cleaned configuration keys
- Pricing captured at add-to-cart time: unit price, line total, and order total stored in sheets

**Contact Inquiry Workflow**
- Contact form with topic dropdown (7 options), preferred contact, and message
- Submission sent to the same Apps Script endpoint as orders
- Inquiries sheet receives every submission with full details
- Email notification to owner for every inquiry
- Loading, success, and error UI states implemented
- Mock submission for development (no endpoint configured)

**Image System**
- Drive hierarchy uses Business Area display names as folder layers (`Bakery/`, `Sewing/`)
- Local `public/images/` mirrors Drive hierarchy with BA display name subfolders
- Product-level images: `public/images/products/{BA}/{Collection}/{Product Name}/`
- Collection-level images: `public/images/collections/{BA}/{Collection Name}/`
- Business-area-level images: `public/images/business-areas/{BA Name}/`
- Gallery images: `public/images/gallery/{category}/` (bakery, sewing, personal)
- Fallback hierarchy: product → collection → business area → default placeholder
- Backward compatible — flat/code-based legacy paths still resolved as fallbacks
- MD5 checksums prevent redundant downloads — unchanged files are skipped

**Featured Logic**
- `homepageFeatured` controls which products appear on the homepage
- `featured` controls which products are highlighted within collections and business area pages
- The two flags operate independently

**Website**
- 17 products across Bakery and Sewing managed through Google Sheets
- 13 collections with dynamic pages for each
- Cart and checkout pages with real order submission
- Gallery page with category filtering, lightbox, and personal image support
- Contact page with working inquiry form and backend integration
- Static Astro site deployed on GitHub Pages

**Publishing Workflow**
- Owner can publish updates from the browser via GitHub Actions manual trigger
- Owner can publish from Google Sheets via the Publish Website menu item
- `npm run update` runs the full data import, validation, and build pipeline
- `push` to `master` also runs the full pipeline
- Failed updates stop before deployment — existing site remains live

### Owner Workflow

**Product and Content Management**
1. Add or update products in Google Sheets
2. Add or change images in Google Drive
3. Run `npm run update` locally (developer machine) or go to GitHub → Actions → Run workflow (any browser)
4. Website is updated with latest data and assets

**Gallery Image Management**
1. Upload images to `Assets/Gallery Images/{Bakery,Sewing,Personal}/` in Google Drive
2. Run `npm run update` — images are automatically imported and integrated
3. No product or collection mapping required for personal images

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

## Planned

### v1.17.3 — Gallery Enhancements

**Status:** Future

**Potential improvements:**
- Homepage gallery preview
- Featured gallery images
- Seasonal collections
- Captions and stories
- Sheet-driven gallery management (beyond current Drive-folder approach)

---

### v1.18 — Website Health & Insights

Purpose:
Provide owner visibility into website quality, operational health,
and business performance without requiring technical knowledge.

Phase 1:
Website Health CLI

Command:
npm run doctor

Features:
- Build status
- Deployment status
- Product validation
- Collection validation
- Asset validation
- Image completeness
- Form validation
- SEO completeness
- Pipeline health
- Overall health score

Phase 2:
Business Insights

Integrations:
- Google Analytics
- Google Search Console

Features:
- Visitor trends
- Popular pages
- Traffic sources
- Search performance
- Customer interactions
- Product interest trends

Phase 3:
Owner Dashboard (Future)

Possible implementations:
- Generated static dashboard
- Google Drive dashboard
- Authenticated dashboard if business requires it

---

### Inquiry → Convert to Order

**Goal:** Allow the owner to convert an inquiry into an order directly from Google Sheets.

**Planned:**
- Copy inquiry data (name, email, phone, preferred contact) into a new Orders row
- Generate a new order ID (`RIP-YYYYMMDD-###`)
- Update the inquiry status to `Converted`
- Link the inquiry ID to the new order ID
- Trigger a notification to the customer

---

## Future Ideas

Longer-term opportunities not yet scoped into specific milestones.

### Website Experience Improvements

**Business Area Page Improvements:**
- Stronger bakery and sewing landing pages
- Better product discovery
- Clear ordering expectations
- Business storytelling

**Product Experience Improvements:**
- Better descriptions
- Preparation/customization details
- Lead times
- Pickup information
- Care instructions
- Bakery ingredients/allergen information
- Sewing material/care information

**SEO & Discoverability:**
- Metadata improvements
- Social sharing/OpenGraph
- Local business SEO
- Product structured data
- FAQ structured data

### Business Operations Foundation

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

### Marketing Foundation

- Google Business Profile
- Social media presence
- Behind-the-scenes content
- Customer stories
- Email list
- Local community marketing

### Future Business Platform Expansion

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

### Technical Improvements

- Build automated test suite (code review + scraping/visual regression)
- Image sizing: investigate images getting cut off (responsive sizing issue)
- "Our Story" page with images
- Hero picture area on homepage
- Homepage first sentence — wording and font refinement
- Wording and pages copy improvements

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

## Changelog

| Date | Change |
|------|--------|
| 2026-07-27 | Restructured into Completed / Planned / Future Ideas sections. Fixed v1.17.1 status to Complete. Added v1.14, v1.15 to Completed. Added Gallery Images row to Sheets vs Drive table. Updated Update Command to 7 steps. Merged duplicate gallery items from Future Phase into v1.17.3. Consolidated Developer Notes into Future Ideas. |
