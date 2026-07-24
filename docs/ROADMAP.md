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

---

# v1.8.2 — Product Pricing Foundation

Status:

Planned

Goal:

Introduce product pricing into the data-driven architecture.

Planned:

* Product price fields in Google Sheets
* Currency handling
* Display pricing on product cards
* Display pricing on product pages
* Support future order calculations

Architecture:

Products remain the source of truth.

Google Sheets
      |
      v
Pipeline
      |
      v
products.json
      |
      v
Product display components

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



## Data Sync Automation

Future:

- Manual GitHub workflow trigger for data refresh
- Scheduled Google Sheets synchronization
- Automatic product/pricing updates
- Availability synchronization


---

# Upcoming Milestones

---

# v1.9 — Product Gallery & Content Improvements

Status:

Planned

Goal:

Improve product presentation and customer experience.

This milestone focuses on making products visually appealing, easier to browse, and ready for future ordering workflows.

Principles:

Keep:

* Astro static generation
* Google Sheets as content source
* Git-based image management
* Data-driven architecture
* Simple business workflow

Avoid:

* Backend complexity
* Manual image URL management
* Duplicate content systems


---

# v1.9 — Product Gallery & Content Improvements

Status:

In Progress

Goal:

Improve product presentation and customer experience.

This milestone focuses on making products visually appealing, easier to browse, and ready for future ordering workflows.

Principles:

Keep:

* Astro static generation
* Google Sheets as content source
* Git-based image management
* Data-driven architecture
* Simple business workflow

Avoid:

* Backend complexity
* Manual image URL management
* Duplicate content systems


---

# v1.9.0 — Product Image Architecture Foundation

Status:

✅ Completed


Goal:

Create a simple automatic image management system.

The business owner manages images by adding files to product folders.

No image URLs are stored in Google Sheets.


## Implemented

### Product ID Convention

Product identifiers now support:

```
{BusinessArea}-{Collection}-{Number}
```

Examples:

```
BK-FP-001
BK-CA-001
SW-SH-001
```

Business area codes:

```
BK = Bakery
SW = Sewing
```


### Image Folder Structure

```
public/
└── images/
    |
    ├── products/
    │    └── {productId}/
    │           ├── 01.jpg
    │           ├── 02.jpg
    │           └── ...
    |
    ├── collections/
    │    └── {collectionId}/
    │           └── 01.jpg
    |
    ├── business-areas/
    │    └── {businessAreaId}/
    │           └── 01.jpg
    |
    └── default-product.jpg
```


### Image Rules

Format:

```
.jpg
```

Naming:

```
01.jpg = primary image

02.jpg - 05.jpg = additional images
```


Rules:

* Maximum 5 images per product
* Images are optional
* No image URLs in Google Sheets


### Image Resolution

Implemented fallback hierarchy:

```
Product image
        |
        v
Collection image
        |
        v
Business area image
        |
        v
Default image
```


### Pipeline Integration

Implemented:

* Image scanner
* Image resolver
* Product image metadata generation
* Primary image generation
* Build warnings for default image usage


Generated product data now includes:

```
images[]
primaryImage
```


### Verification

Completed:

```
npm run import:data ✅

npm run build ✅

31 pages built
0 errors
```


---

# v1.9.0.1 — Demo Product Image Population

Status:

Planned


Goal:

Validate the complete image workflow using representative demo images.


Tasks:

* Use existing imported product catalog
* Create demo product image folders
* Populate sample JPG images
* Verify product image discovery
* Verify fallback behavior


Coverage:

Create examples for:

* Bakery products
* Sewing products
* Products using fallback images


Image requirements:

* Development/demo only
* Replace before production
* JPG format
* Follow final folder naming rules


Verification:

```
npm run import:data
npm run build
```


---

# v1.9.1 — Product Gallery Component

Status:

Planned


Goal:

Improve product detail page presentation.


Add:

* Main product image
* Thumbnail images
* Image switching
* Responsive gallery layout
* Missing image handling


Customer flow:

```
Product Page

      |
      v

Image Gallery

      |
      +-- Main Image
      |
      +-- Thumbnails

      |
      v

Product Information

      |
      v

Customization Form
```


---

# v1.9.2 — Product Card Improvements

Status:

Planned


Goal:

Improve collection browsing.


Add:

* Better product images
* Improved card layout
* Short descriptions
* Visual consistency
* Optional featured indicators


---

# v1.9.3 — Collection Presentation Improvements

Status:

Planned


Goal:

Make collection pages feel like product catalogs.


Add:

* Collection hero images
* Collection descriptions
* Improved headers
* Better product grouping
* Collection fallback images


---

# v1.9.4 — Homepage Product Highlights

Status:

Planned


Goal:

Improve product discovery.


Add:

* Featured products
* Featured collections
* Bakery highlights
* Sewing highlights


Possible fields:

```
featured
displayOrder
```


---

# v1.9.5 — Content Management Refinement

Status:

Planned


Goal:

Prepare website content for ordering workflow.


Add:

* Better product descriptions
* Collection descriptions
* Product availability flags
* SEO metadata from Google Sheets
* Improved content consistency


Reason:

A reliable ordering system requires customers to trust and understand the products first.


---

# v1.9 Completion Criteria

Completed when:

✅ Products support multiple images  
✅ Images are automatically discovered  
✅ Fallback image system works  
✅ Product pages have galleries  
✅ Collection pages look like catalogs  
✅ Homepage highlights products  
✅ Content is ready for ordering workflow

---

# v1.9.1 — Product Gallery Component

Status:

Planned


Goal:

Improve product detail pages.


Add:

* Main product image
* Thumbnail images
* Image switching
* Responsive gallery layout
* Missing image handling


Customer flow:

```
Product Page

      |
      v

Gallery

      |
      +-- Main Image
      |
      +-- Additional Images

      |
      v

Customization
```


---

# v1.9.2 — Product Card Improvements

Status:

Planned


Goal:

Improve collection browsing.


Add:

* Better product images
* Improved card layout
* Short descriptions
* Visual consistency
* Optional featured badge


Collection view:

Before:

```
Image

Product Name
```


After:

```
Image

Product Name

Short Description

Featured indicator
```


---

# v1.9.3 — Collection Presentation Improvements

Status:

Planned


Goal:

Make collection pages feel like product catalogs.


Add:

* Collection hero images
* Collection descriptions
* Improved headers
* Better product grouping
* Collection fallback images


Example:

```
Bakery

Filled Pockets

[Collection Image]

Description

Products
```

---

# v1.9.4 — Homepage Product Highlights

Status:

Planned


Goal:

Improve product discovery.


Add:

* Featured products
* Featured collections
* Bakery highlights
* Sewing highlights


Possible Google Sheet fields:

```
featured
displayOrder
```


Example:

```
Homepage

Featured Bakery

[Product]
[Product]
[Product]


Featured Sewing

[Product]
[Product]
[Product]
```


---

# v1.9.5 — Content Management Refinement

Status:

Planned


Goal:

Prepare website content for ordering workflow.


Add:

* Better product descriptions
* Collection descriptions
* Product availability flags
* SEO metadata from Google Sheets
* Improved content consistency


Reason:

A reliable ordering system requires customers to trust and understand the products first.


---

# v1.9 Completion Criteria

Completed when:

✅ Products support multiple images  
✅ Images are automatically discovered  
✅ Fallback image system works  
✅ Product pages have galleries  
✅ Collection pages look like catalogs  
✅ Homepage highlights products  
✅ Content is ready for ordering workflow


Focus:

Improve customer experience without changing architecture.


---

## v2.0 — Ordering Workflow

RIPPLE Catalog Sheet

Purpose:
Website content management

Contains:

Products
Collections
Product Options
Forms


RIPPLE Orders Sheet

Purpose:
Customer transaction records

Contains:

Orders
Order Items
Customers (future)
Payments (future)


Order Structure:

Orders sheet:

Order ID
Customer Information
Order Status
Date
Total


Order Items sheet:

Order ID
Product ID
Product Name
Quantity
Customization Data
Price

Example:

Orders

RPL-000123
John Smith
Pending


Order Items

RPL-000123
Baby Blanket
Blue
Name: Emma

RPL-000123
Custom Shirt
Size: M
Theme: Dragon

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
