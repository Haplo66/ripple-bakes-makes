# RIPPLE Bakes & Makes — Project Continuation Notes (Updated)

## Project Status

We are building **RIPPLE Bakes & Makes**, an Astro static website deployed on GitHub Pages.

Current stack:

* Astro `6.4.8`
* TypeScript
* GitHub Pages deployment
* Google Sheets as the content source
* Static site generation

Repository:

* Branch: `master`
* Base path: `/ripple-bakes-makes`

---

# AI Workflow Preference

* Use ChatGPT for:

  * architecture
  * planning
  * reviews
  * implementation prompts

* Use DeepSeek/Codex-style tools for implementation.

When providing implementation prompts:

* Provide one single copy-paste markdown block.
* Keep prompts concise because local models have limited tokens.
* Recommend the appropriate model/effort when relevant.

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
      └── static/
          ├── gallery.ts
          └── testimonials.ts
      |
      v
Astro pages/components
```

---

# Completed Milestones

## v1.5 — Google Sheets Pipeline

Completed and tagged.

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

Environment variables:

```
GOOGLE_SHEETS_CLIENT_EMAIL
GOOGLE_SHEETS_PRIVATE_KEY
GOOGLE_SHEETS_ID
SHEETS_ENABLED=true
```

Service account:

```
ripple-reader
```

---

## v1.5.1 — Product Slug Generation

Completed and tagged.

Problem:

Astro dynamic route required:

```
product.slug
```

Google Sheets intentionally does not contain slug data.

Solution:

* Pipeline generates slugs automatically.
* Business users keep a simple spreadsheet.
* Technical fields remain inside the pipeline.

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
* zero warnings

---

# Data Status

Current generated data:

Collections:

```
10 collections
```

Products:

```
13 products
```

Forms:

```
6 forms
```

Build status:

```
Successful
0 errors
```

---

# Product Image Architecture

Implemented:

* Product images array support
* Collection images support
* Image helper utilities

File:

```
src/utils/images.ts
```

Helpers:

```
getProductImages()
getProductPrimaryImage()
getCollectionImages()
getCollectionPrimaryImage()
```

Images:

```
public/images/

├── bakery/
└── sewing/
```

Current behavior:

* Real images supported.
* Missing images fall back to placeholders.

---

# v1.6-rebranding — RIPPLE Brand Migration

Completed and tagged.

Tag:

```
v1.6-rebranding
```

Implemented:

## Repository

* GitHub repository renamed:

  * from Honeycomb Arts & Bakes
  * to RIPPLE Bakes & Makes

* Local project folder renamed.

## Branding

Completed:

* RIPPLE logo assets integrated.
* Old Honeycomb references cleaned.
* Branding updated across the project.

## Logo handling

Implemented:

Header:

```
ripple-logo-transparent.png
```

Footer:

```
ripple-logo.png
```

`Logo.astro` now supports selecting the correct logo variant.

## Favicon

Implemented:

```
public/ripple-symbol.png
```

Updated:

```
src/layouts/MainLayout.astro
```

Verified:

```
/ripple-bakes-makes/ripple-symbol.png
```

## Verification

Build:

```
31 pages
0 errors
```

---

# Current State

The project is stable after rebranding.

Latest milestone:

```
v1.6-rebranding
```

Next milestone:

```
v1.7 — Product Options Integration
```

---

# v1.7 Planned Work — Product Options Integration

Goal:

Connect the existing Google Sheets Product Options system into the product architecture.

Current:

```
Google Sheets

Products
Collections
Forms
```

Need to add:

```
Product Options
```

Flow:

```
Google Sheets
(Product Options tab)

        |
        v

Pipeline

        |
        v

Generated content

        |
        v

Product model

        |
        v

Product detail page

        |
        v

Customization/order flow
```

---

## Existing Product Options Setup

Already exists:

Google Sheet:

```
Product Options
```

Columns:

```
Product ID
Option Name
Option Type
Values
```

Type file:

```
src/types/product-options.ts
```

Not yet integrated.

---

## v1.7 — Product Options Integration ✅

Completed.

Implemented:

- Product Options Google Sheets integration
- Pipeline import support
- Validation and normalization
- Generated product-options content
- Product option data layer
- Product-to-options relationship using productId
- Product page "Available Options" display

Architecture:

- Products remain independent from customization options.
- Options are data-driven.
- No duplicated product data.
- No checkout/order logic introduced.

Verification:

npm run import:data ✅
npm run build ✅
0 warnings

Tag:

v1.7-product-options

---

## v1.8 — Dynamic Customization & Forms Enhancement

v1.8 Decision: Product Options are the source of truth for product customization fields. 
Forms consume Product Options instead of duplicating them

Goal:

Improve the product customization experience.

deepseek note:
Assumptions
1.
Products with both formId and Product Options → Product Options take priority for customization; formId is ignored for field rendering. Products with only formId (no options) retain existing behavior.
2.
The formId field on products CSV remains required (for backward compatibility and general form linking), but its role shifts from “customization form ID” to “general form ID (fallback).”
3.
Existing FormRenderer cart/submit JS is acceptable — it was already running on the page.
Open Question for You
How should we handle products that have both a formId reference (e.g., adult-t-shirt-form with its own field definitions) and Product Options that define the same/similar fields? Currently they’d produce duplicate fields. Options:
•
A (recommended): Product Options fully replace formId-based customization. If options exist, ignore formId. Only use formId as fallback when no options exist.
•
B: Merge both — append formId fields after options fields (risks duplication).
•
C: Keep both on page — options section + formId section (redundant).


---

## v1.9 — Product Gallery & Content Improvements

Goal:

Improve product presentation.

Planned:

- Better image galleries.
- Multiple product images.
- Image ordering.
- Gallery interactions.
- Improved collection pages.
- More polished product cards.

---

## v2.0 — Ordering Workflow

Goal:

Create a complete customer order experience.

Potential features:

- Cart/order collection.
- Customer details.
- Product customization summary.
- Order submission.
- Email notification workflow.
- Order management process.

Constraints:

- Keep architecture compatible with static Astro.
- Avoid unnecessary backend complexity.
- Prefer free solutions.

---

## v2.x — Business Management Improvements

Future possibilities:

- Better inventory management.
- Availability tracking.
- More advanced Google Sheets workflows.
- Order history.
- Customer communication tools.
- Analytics.

Only implement when needed.


# Important Constraints

Do not:

* Move away from Astro static generation.
* Remove Google Sheets pipeline.
* Add paid services.
* Put unnecessary technical fields into Google Sheets.
* Overcomplicate the order system.

Keep:

* Google Sheets business-friendly.
* Transformations inside TypeScript pipeline.
* Static site architecture.

---

# Current Starting Point

Continue from:

**v1.6-rebranding complete**

Next objective:

**v1.8**

