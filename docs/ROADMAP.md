# RIPPLE Bakes & Makes — Project Roadmap

## Project Overview

RIPPLE Bakes & Makes is an Astro static website deployed on GitHub Pages.

Current stack:

* Astro 6.4.8
* TypeScript
* GitHub Pages
* Google Sheets as business content source
* Static site generation

Repository:

* Branch: `master`
* Base path: `/ripple-bakes-makes`

---

# Development Philosophy

## Architecture Principles

Keep:

* Astro static generation
* Google Sheets as the business-friendly data source
* TypeScript transformations inside the pipeline
* Simple maintenance workflow
* Free solutions only

Avoid:

* Unnecessary backend complexity
* Paid services
* Technical fields exposed to business users
* Overengineering before needed

---

# AI Workflow

Use ChatGPT for:

* Architecture
* Planning
* Reviews
* Implementation prompts

Use DeepSeek/Codex-style tools for:

* Code implementation
* Refactoring
* Testing

Implementation prompts should:

* Be a single copy-paste markdown block
* Stay concise
* Recommend model/effort when useful

Current preferred implementation model:

* DeepSeek V4 Flash Free
* High Thinking
* Build mode for implementation tasks
* Planning mode for architecture decisions

---

# Current Architecture

## Data Flow

```
Google Sheets
      |
      v
scripts/pipeline/
      |
      ├── reader.ts
      ├── sheets-reader.ts
      ├── csv-reader.ts
      ├── validators.ts
      ├── normalizers.ts
      ├── generators.ts
      |
      v
src/content/
      |
      ├── products.json
      ├── collections.json
      └── forms.json
      |
      v
src/data/
      |
      ├── products.ts
      ├── collections.ts
      ├── forms.ts
      └── product-options.ts
      |
      v
Astro pages/components
```

---

# Completed Milestones

---

# v1.5 — Google Sheets Pipeline

Status:

✅ Completed

Implemented:

* Google Sheets API integration
* Service account authentication
* Sheet reader abstraction
* CSV fallback support

Pipeline:

```
scripts/pipeline/

├── constants.ts
├── csv-reader.ts
├── generators.ts
├── import-data.ts
├── logger.ts
├── normalizers.ts
├── reader.ts
├── sheets-auth.ts
├── sheets-reader.ts
├── types.ts
└── validators.ts
```

Environment:

```
GOOGLE_SHEETS_CLIENT_EMAIL
GOOGLE_SHEETS_PRIVATE_KEY
GOOGLE_SHEETS_ID
SHEETS_ENABLED=true
```

---

# v1.5.1 — Product Slug Generation

Status:

✅ Completed

Problem:

Astro dynamic routes require:

```
product.slug
```

Solution:

* Pipeline generates slugs automatically
* Business users keep simple spreadsheets
* Technical fields remain inside TypeScript

Example:

```
Personalized Baby Blanket
```

becomes:

```
personalized-baby-blanket
```

Verification:

* `npm run import:data` ✅
* `npm run build` ✅

---

# v1.6 — RIPPLE Rebranding

Status:

✅ Completed

Implemented:

## Repository

Changed:

* Honeycomb Arts & Bakes
* RIPPLE Bakes & Makes

## Branding

Completed:

* RIPPLE logo assets
* Updated references
* New favicon assets
* Header/footer logo handling

Logo system:

Header:

```
ripple-logo-transparent.png
```

Footer:

```
ripple-logo.png
```

Favicon:

```
public/ripple-symbol.png
```

Verification:

```
31 pages
0 errors
```

---

# v1.7 — Product Options Integration

Status:

✅ Completed

Goal:

Connect product customization options from Google Sheets into the product architecture.

Implemented:

Google Sheet:

```
Product Options
```

Pipeline support:

```
Google Sheets
      |
      v
Pipeline
      |
      v
product-options.json
      |
      v
Product customization system
```

Added:

* Product option import
* Validation
* Normalization
* Product option data layer
* Product option lookup by product ID

Architecture decisions:

* Product Options reference products using `productId`
* Product records remain unchanged
* No duplicated product customization fields
* Options remain data-driven

---

# v1.8 — Dynamic Customization Forms

Status:

✅ Completed

Goal:

Use Product Options as the source of product customization fields.

Implemented:

Product Options now generate dynamic form fields.

Flow:

```
Product Options
        |
        v
Option conversion layer
        |
        v
Form fields
        |
        v
FormRenderer
```

Added:

* Product option field conversion
* Required fields
* Display ordering
* Placeholder support
* Help text support
* Radio option type

Architecture:

```
Product Options = primary customization source

formId forms = fallback
```

Behavior:

* Products with Product Options use generated fields
* Products without options continue using existing forms

Verification:

* `npm run import:data` ✅
* `npm run build` ✅

---

# v1.8.1 — Product Collection Display

Status:

✅ Completed

Goal:

Connect collection pages with product browsing.

Implemented:

Collection pages now load products dynamically.

Flow:

```
Collection
     |
     v
getProductsByCollection()
     |
     v
ProductGrid
     |
     v
ProductCard
```

Added:

* Product loading on collection pages
* ProductGrid integration
* Product cards displayed inside collections

Verification:

```
npm run import:data
npm run build

31 pages built
```

Verified:

* Collection pages show products
* Product detail routes remain functional
* No build warnings


v1.8.2 — Product Pricing Foundation

---

# Current Product Architecture

Current customer flow:

```
Home
 |
 +-- Bakery
 |      |
 |      +-- Collection
 |              |
 |              +-- Product
 |                      |
 |                      +-- Customization
 |
 +-- Sewing
        |
        +-- Collection
                |
                +-- Product
                        |
                        +-- Customization
```

---

# Upcoming Milestones

---

# v1.9 — Product Gallery & Content Improvements

Status:

Planned

Goal:

Improve product presentation.

Planned:

* Multiple product images
* Image ordering
* Better product galleries
* Gallery interactions
* Improved product cards
* Better collection presentation
* Featured product sections
* Homepage product highlights

Focus:

Improve customer experience without changing architecture.

---

# v2.0 — Ordering Workflow

Status:

Planned

Goal:

Create complete customer order experience.

Potential features:

* Cart/order collection
* Customer information
* Product customization summary
* Order submission
* Email notification workflow
* Order management process

Constraints:

* Keep Astro static architecture
* Prefer free solutions
* Avoid unnecessary backend complexity

---

# v2.x — Business Management Improvements

Status:

Future

Possible improvements:

* Inventory management
* Availability tracking
* Improved Google Sheets workflows
* Order history
* Customer communication tools
* Analytics

Only implement when business needs justify complexity.

---

# Current Status Summary

Completed:

```
v1.5     Google Sheets Pipeline              ✅
v1.5.1   Product Slug Generation             ✅
v1.6     RIPPLE Rebranding                   ✅
v1.7     Product Options Integration         ✅
v1.8     Dynamic Customization Forms         ✅
v1.8.1   Product Collection Display           ✅
```

Current architecture supports:

```
Google Sheets
      |
      v
Products + Collections + Options + Forms
      |
      v
Dynamic Astro Website
      |
      v
Product Discovery + Customization
```

Next objective:

```
v1.9 — Product Gallery & Content Improvements
```
