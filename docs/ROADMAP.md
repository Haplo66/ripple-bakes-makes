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
       │                            Logo and Symbol
       │                            Favicon
       │                                  │
       └──────────┬───────────────────────┘
                  │
                  ▼
         RIPPLE Content Pipeline
                  │
          ┌───────┴────────┐
          │                 │
          ▼                 ▼
   Import: Data        Import: Assets
   (normalize,         (MD5 sync,
    validate)           download)
          │                 │
          └───────┬─────────┘
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

### Order Pipeline (Operational Data)

```
Customer Browser
        │
        ▼
  Astro Website (Cart → Checkout)
        │
        ▼
  Google Apps Script Web App
        │
        ├── Orders Sheet
        ├── Order Items Sheet
        └── Email Notification
```

### Sheets vs Drive Responsibility

| Content Type | Source | Target |
|-------------|--------|--------|
| Product metadata | Google Sheets | Generated JSON |
| Collection metadata | Google Sheets | Generated JSON |
| Form definitions | Google Sheets | Generated JSON |
| Product images | Google Drive | `public/images/products/` |
| Collection images | Google Drive | `public/images/collections/` |
| Homepage banners | Google Drive | `public/images/home/` |
| Business area images | Google Drive | `public/images/business-areas/` |
| Logo and symbol | Google Drive | `public/images/logo/` |
| Favicon files | Google Drive | `public/` |

### The Update Command

`npm run update` executes six steps in sequence:

1. **Validate environment** — check required configuration
2. **Normalize Drive assets** — repair known asset formatting issues before import
3. **Import Drive assets** — sync all asset areas from Drive
4. **Import Sheets data** — read and normalize all business data
5. **Validate generated content** — check for missing images, empty datasets
6. **Build Astro site** — generate the static website

### Key Architecture Decisions

- **Product IDs are the stable identifier.** Image discovery uses product ID patterns. Human-readable folder names exist for owner browsing but are ignored by the pipeline.
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

---

## Current Status

**Version: v1.12.1**

### What Works Today

**Content Pipeline**
- Google Sheets manages all structured business data: products, collections, and forms
- Google Drive manages all business assets: product images, collection images, business area images, homepage images, logo, and favicon
- `npm run update` synchronises both sources and rebuilds the website in a single command
- Data quality warnings catch missing fields before they reach production
- Forms sheet uses row-per-field structure for simpler management
- Product Options sheet is no longer required

**Ordering Workflow**
- Customers can browse, customize, add to cart, and submit orders
- Orders are sent to Google Apps Script which writes to Google Sheets
- Owner receives email notification for every new order with pricing details
- Order status managed directly in Google Sheets (Received → Confirmed → Preparing → Ready → Completed)
- Product customizations preserved in the Order Items sheet with cleaned configuration keys
- Pricing captured at add-to-cart time: unit price, line total, and order total stored in sheets

**Image System**
- Product-level images imported from Drive and linked by Product ID
- Collection-level images imported from Drive, stored under `public/images/collections/`, connected to collection metadata, and displayed on collection pages
- Business-area-level fallback images for products without collection images
- Graceful fallback hierarchy: product → collection → business area → default placeholder
- MD5 checksums prevent redundant downloads — unchanged files are skipped

**Featured Logic**
- `homepageFeatured` controls which products appear on the homepage
- `featured` controls which products are highlighted within collections and business area pages
- The two flags operate independently

**Website**
- 17 products across Bakery and Sewing managed through Google Sheets
- 13 collections with dynamic pages for each
- Cart and checkout pages with real order submission
- Static Astro site deployed on GitHub Pages

### Owner Workflow

**Product and Content Management**
1. Add or update products in Google Sheets
2. Add or change images in Google Drive
3. Run `npm run update`
4. Website is updated with latest data and assets

**Order Management**
1. Receive email notification for new orders with itemised pricing
2. View order details, customizations, and pricing in Google Sheets
3. Update order status as it progresses
4. Communicate with customer to arrange pickup

### Known Small Improvements

- Validation reports during `npm run update` could be more actionable for non-technical users.

---

## Next Milestones

### v1.13 — Business Readiness

The technical foundation is complete. This milestone focuses on validating and simplifying the real owner workflow.

Goals:

- Review the complete workflow with the owner
- Confirm Google Sheets usability
- Confirm Google Drive folder structure
- Create owner documentation
- Test real business scenarios:
  - Add a product
  - Update pricing
  - Upload images
  - Receive an order
  - Update order status
- Improve validation messages for non-technical users


### v1.14 — Customer Experience

Customer-facing improvements.

Possible improvements:

- Improve product browsing
- Improve collection presentation
- Mobile UX refinements
- Better inquiry/order experience
- Gallery improvements


### Future — Business Operations

Long-term operational tools:

- Inventory tracking
- Order reporting
- Customer history
- Sales analytics
- Business dashboards

---

## Development Principles

- **Static Astro architecture.** No backend, no database servers, no runtime dependencies.
- **Google Workspace is the single source of truth.** All content originates in Sheets or Drive. Never edit generated files.
- **Clear separation of concerns.** Data (Sheets), assets (Drive), and presentation (Astro) are independent layers connected only by the pipeline.
- **Free solutions only.** The entire stack uses free tiers — GitHub Pages, Google Workspace, open-source tools.
- **Add complexity when needed, not before.** Every feature must justify its existence against the business need.
- **The owner should never touch code.** Every interaction with the website should be through Google Workspace or the `npm run update` command.

---

## Maintenance Rule

Update ROADMAP.md only when:
- A milestone is completed
- Project direction changes
- Major architecture decisions are made

Do not add implementation history, debugging notes, terminal output, bug fixes, file lists, or code snippets. Those belong in commit messages or technical documentation.
