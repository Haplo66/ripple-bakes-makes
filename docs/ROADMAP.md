# RIPPLE Bakes & Makes — Project Roadmap

## Project Overview

RIPPLE Bakes & Makes is an Astro static website deployed on GitHub Pages.

The website supports two business areas:

- Bakery
- Sewing

The goal is to provide a beautiful product catalog experience while keeping the business workflow simple and maintainable.

Current stack:

- Astro 6.4.8
- TypeScript
- GitHub Pages
- Google Sheets as business content source
- Static site generation

Repository:

- Branch: `master`
- Base path: `/ripple-bakes-makes`

---

# Development Philosophy

## Principles

Keep:

- Astro static generation
- Google Sheets as the business-friendly data source
- TypeScript transformations inside the build pipeline
- Simple maintenance workflow
- Free solutions only

Avoid:

- Unnecessary backend complexity
- Paid services
- Technical fields exposed to business users
- Overengineering before business needs require it

---

# AI Workflow

Use ChatGPT for:

- Architecture
- Planning
- Reviews
- Implementation prompts

Use DeepSeek/Codex-style tools for:

- Code implementation
- Refactoring
- Testing

Implementation prompts should:

- Be a single copy/paste markdown block
- Clearly define scope
- Recommend model/effort when useful

Current preferred implementation model:

- DeepSeek V4 Flash Free
- High Thinking
- Build mode for implementation tasks
- Planning mode for architecture decisions

---

# Current Architecture

## Data Flow

```
Google Sheets
      |
      v
Pipeline
      |
      v
Generated Content
      |
      |
      +-- Products
      +-- Collections
      +-- Product Options
      +-- Forms
      |
      v
Astro Pages + Components
      |
      v
Static Website
```

## Business Data Source

Google Sheets manages:

- Products
- Collections
- Product options
- Forms

Technical processing remains inside the TypeScript pipeline.

---

# Completed Milestones

---

# v1.5 — Google Sheets Pipeline

Status:

✅ Completed

Goal:

Create a business-friendly content management workflow.

Implemented:

- Google Sheets integration
- Authentication support
- Data reader abstraction
- CSV fallback support
- Import pipeline

Result:

Business data can be maintained without editing code.

---

# v1.5.1 — Product Slug Generation

Status:

✅ Completed

Goal:

Support Astro dynamic routes without exposing technical fields.

Implemented:

- Automatic slug generation during import
- Product routing support
- Name changes without breaking references

Example:

```
Personalized Baby Blanket
```

becomes:

```
personalized-baby-blanket
```

---

# v1.6 — RIPPLE Rebranding

Status:

✅ Completed

Goal:

Replace Honeycomb Arts & Bakes branding with RIPPLE Bakes & Makes.

Implemented:

- Repository rename
- Logo updates
- Favicon updates
- Header/footer branding system

Logo handling:

Header:

```
ripple-logo-transparent.png
```

Footer:

```
ripple-logo.png
```

---

# v1.7 — Product Options Integration

Status:

✅ Completed

Goal:

Connect product customization options from Google Sheets into the product architecture.

Implemented:

- Product Options data source
- Import pipeline support
- Validation
- Normalization
- Product option lookup

Architecture decision:

Product options reference products using:

```
productId
```

Products remain the source of truth.

---

# v1.8 — Dynamic Customization Forms

Status:

✅ Completed

Goal:

Generate product customization forms dynamically.

Implemented:

- Product option conversion
- Dynamic form fields
- Required fields
- Ordering/display rules
- Help text support

Architecture:

```
Product Options
        |
        v
Generated Form Fields
        |
        v
Form Renderer
```

Behavior:

- Products with options generate forms automatically.
- Existing forms remain as fallback.

---

# v1.8.1 — Product Collection Display

Status:

✅ Completed

Goal:

Connect collections with product browsing.

Implemented:

- Dynamic product loading
- Product grids
- Product cards
- Collection-to-product flow

Customer flow:

```
Collection
     |
     v
Products
     |
     v
Product Detail
```

---

# v1.8.2 — Product Pricing Foundation

Status:

✅ Completed

Goal:

Introduce product pricing into the data-driven system.

Implemented:

- Product pricing fields
- Currency handling
- Pricing display support

Architecture:

```
Google Sheets
      |
      v
Pipeline
      |
      v
Products Data
      |
      v
Website Display
```

---

# v1.9 — Product Gallery & Content Improvements

Status:

🚧 In Progress

Goal:

Improve product presentation and prepare the website for future ordering workflows.

Principles:

Keep:

- Astro static generation
- Google Sheets workflow
- Data-driven architecture
- Simple maintenance

Avoid:

- Backend complexity
- Duplicate content systems
- Manual technical workflows

---

# v1.9.0 — Product Image Architecture Foundation

Status:

✅ Completed

Goal:

Create a simple product image management system.

Design:

The business owner manages images by adding files to product folders.

No image URLs are stored in Google Sheets.

Product ID convention:

```
{BusinessArea}-{Collection}-{Number}
```

Examples:

```
BK-FP-001
SW-SH-001
```

Image structure:

```
public/
└── images/
    └── products/
        └── {productId}/
            ├── 01.jpg
            ├── 02.jpg
            └── 03.jpg
```

Image priority:

```
Product Image
      |
      v
Collection Image
      |
      v
Business Area Image
      |
      v
Default Image
```

Implemented:

- Image discovery
- Product image resolver
- Fallback handling
- Product image data fields

---

# v1.9.1 — Product Gallery Component

Status:

✅ Completed

Goal:

Improve product detail pages with visual product galleries.

Implemented:

- Main product image
- Thumbnail images
- Image switching
- Responsive gallery
- Missing image handling

```
Product Page

      |
      v

Gallery

      |
      +-- Main Image
      |
      +-- Additional Images
```

# v1.9.1.1 — Product Page Layout Polish

Status:

🚧 In Progress

Goal:

Improve the product detail page layout after completing the gallery system.

The gallery functionality is complete. This milestone focuses on product presentation and brand experience.

Objectives:

- Create a balanced desktop product hero layout
- Display product image and product information together
- Improve visual hierarchy
- Reduce oversized image dominance
- Improve spacing and typography
- Maintain RIPPLE boutique handmade style

Desktop direction:

```
Product Gallery        Product Information

Main Image             Category
                       Product Name
Thumbnails             Price
                       Description
                       Customization
```

Mobile direction:

```
Image

Thumbnails

Category

Product Name

Price

Description

Customization
```

Keep:

- Existing gallery component
- Existing data architecture
- Existing product flow
- RIPPLE typography direction

Avoid:

- Architecture changes
- New backend requirements
- Unnecessary components

---

# Upcoming Milestones

---

# v1.9.2 — Catalog Experience Improvements

Status:

✅ Completed

Goal:

Improve product discovery and make the catalog feel like a connected handmade boutique experience.

Implemented:

- Fixed bakery and sewing product discovery flow
- Added featured product sections using existing data model
- Improved product detail breadcrumbs
- Added "More from this collection" related products
- Improved product descriptions and subtitles
- Preserved existing ProductCard/ProductGrid architecture
- Maintained static Astro architecture

Architecture:

- No new components introduced
- No new data fields introduced
- Existing Product model reused
- Existing routing preserved

Validation:

- npm run build successful
- 31 pages generated
- 0 errors
- 0 warnings
---


# v1.9.3 — Collection Presentation Improvements

Status:

✅ Completed

Goal:

Make collections feel like polished handmade product catalog pages.

Implemented:

- Added consistent collection inquiry CTA:
  "Ask About This Collection"
- Improved collection hero presentation
- Added meaningful collection subtitles
- Improved collection descriptions
- Added collection ideas and customization notes
- Added image tone variety
- Removed empty collection sections
- Improved bakery and sewing collection messaging

Architecture:

- No new data fields
- No new components
- Existing Collection model reused
- Existing static Astro architecture preserved

Validation:

- npm run build successful
- 31 pages generated
- 0 errors
- 0 warnings

---

# v1.9.4 — Homepage Product Highlights & Brand Experience

Status:

✅ Completed

Goal:

Transform the homepage into a boutique storefront that introduces the RIPPLE brand and improves product discovery while maintaining the inquiry-based customer workflow.

Implemented:

- Added featured products section to homepage
- Connected homepage discovery to existing featured product system
- Improved RIPPLE hero branding with ripple symbol accent
- Updated homepage CTAs to match inquiry workflow
- Removed customer-facing placeholder wording
- Improved bakery/sewing CTA wording
- Fixed homepage content quality issues
- Preserved cart navigation as part of future inquiry workflow

Architecture:

- Reused existing ProductGrid/ProductCard components
- Reused existing product data and featured flags
- No new data fields
- No new backend requirements
- Cart functionality preserved for future order-request workflow

Validation:

- npm run build successful
- 31 pages generated
- 0 errors

---

# v1.9.5 — Content Management Refinement

Status:

Planned

Goal:

Prepare product content for ordering workflows.

Planned:

- Better product descriptions
- Collection descriptions
- Product availability flags
- SEO metadata
- Content consistency improvements

Reason:

A reliable ordering system requires customers to understand and trust the products first.

---

# v1.9 Completion Criteria

Completed when:

✅ Products support multiple images  
✅ Images are automatically discovered  
✅ Image fallback system works  
✅ Product pages have galleries  
✅ Product pages have polished presentation  
✅ Collection pages feel like catalogs  
✅ Homepage highlights products  
✅ Content is ready for ordering workflow  

---

# v2.0 — Ordering Workflow

Status:

Future

Goal:

Introduce customer ordering and business order management.

Architecture:

Separate catalog data from transaction data.

---

## Catalog Sheet

Purpose:

Website content management.

Contains:

- Products
- Collections
- Product Options
- Forms

---

## Orders Sheet

Purpose:

Customer transaction records.

Contains:

- Orders
- Order Items
- Customer information (future)
- Payments (future)

---

## Order Structure

Orders:

```
Order ID
Customer Information
Order Status
Date
Total
```

Order Items:

```
Order ID
Product ID
Product Name
Quantity
Customization Data
Price
```

Example:

```
Order:

RPL-000123
John Smith
Pending


Items:

Baby Blanket
Blue
Name: Emma


Custom Shirt
Size: M
Theme: Dragon
```

---

# v2.x — Business Management Improvements

Status:

Future

Possible improvements:

- Inventory management
- Availability tracking
- Improved Google Sheets workflows
- Order history
- Customer communication tools
- Analytics

Only implement when business needs justify additional complexity.

---

# Current Status Summary

Completed:

```
v1.9.0   Product Image Architecture              ✅
v1.9.1   Product Gallery                         ✅
v1.9.1.1 Product Page Layout Polish              ✅
v1.9.2   Catalog Experience Improvements         ✅
v1.9.3   Collection Presentation Improvements    ✅
v1.9.4   Homepage Product Highlights             ✅
```

Upcoming:

```
v1.9.5     Content Management Refinement           ⏳
v2.0       Ordering Workflow                       ⏳
```

---

# Current Architecture Supports

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
      |
      v
Future Ordering Workflow
```

---

# Next Objective

Complete:

```
v1.9.1.1 — Product Page Layout Polish
```

Then continue with:

```
v1.9.2 — Product Card Improvements
```