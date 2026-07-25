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
| Business Data | Google Sheets | Products, collections, forms, options |
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

## Current Architecture

### Data Flow

```
Google Sheets                     Google Drive
  Products                          Product Images
  Collections                       Collection Images
  Forms                             Homepage Images
  Product Options                   Business Area Images
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

### Sheets vs Drive Responsibility

| Content Type | Source | Target |
|-------------|--------|--------|
| Product metadata | Google Sheets | Generated JSON |
| Collection metadata | Google Sheets | Generated JSON |
| Form definitions | Google Sheets | Generated JSON |
| Product options | Google Sheets | Generated JSON |
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

---

## Current Status

**Version: v1.10.6**

### What Works Today

- The owner manages all products, collections, and forms in Google Sheets
- The owner manages all images and branding in Google Drive
- Running `npm run update` synchronises everything and rebuilds the website
- The website is a fast, static Astro site deployed on GitHub Pages
- 17 products across Bakery and Sewing managed through Google Sheets. Product images are synchronized from Google Drive where available.
- Missing images gracefully fall back through a hierarchy to a default placeholder
- Data quality warnings catch missing fields before they reach production

### Owner Workflow

1. Add or update products in Google Sheets
2. Add or change images in Google Drive
3. Run `npm run update`
4. Website is updated with latest data and assets

### Known Small Improvements

- `formId` is currently required for all products, but not all products need an order form (e.g., standard bakery items). Should be made optional in a future update.
- Two products (BK-FP-003, BK-SB-002) have Drive folders but no uploaded images yet — the pipeline handles this gracefully with default placeholders.
- Validation reports during `npm run update` could be more actionable for non-technical users.

---

## Next Milestones

### v1.11 — Business Readiness

The current pipeline works technically. This milestone makes it work for the owner.

- Finalise owner documentation and troubleshooting guide
- Improve `npm run update` output to be clearer for non-technical users
- Test the full workflow with real business scenarios
- Remove remaining development assumptions (optional formId, default values)
- Add pre-flight checks that catch common setup issues early

### v1.12 — Ordering Workflow

RIPPLE currently supports enquiries but not direct ordering. This milestone introduces order management.

- Design and implement Orders sheet schema
- Support multiple products per order
- Order status tracking (received, in progress, completed, delivered)
- Email notification for new orders
- Owner order management workflow

### v1.13 — Customer Experience

Polishes the customer-facing side of the website.

- Improve product browsing and filtering
- Enhance collection presentation
- Gallery improvements
- Better ordering UX and checkout flow
- Mobile experience refinements

### Future — Business Operations

Long-term capabilities that will be added as the business grows.

- Inventory tracking and stock availability indicators
- Customer history and order history
- Basic analytics (popular products, order trends)
- Business workflow tools (reporting dashboards)

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
