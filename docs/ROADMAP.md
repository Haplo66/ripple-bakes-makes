# RIPPLE Bakes & Makes — Project Roadmap

## Project Overview

RIPPLE Bakes & Makes is an Astro static website deployed on GitHub Pages.

Purpose:

- Beautiful handmade product catalog
- Simple business maintenance workflow
- Future-ready inquiry and order workflow

Business areas:

- Bakery
- Sewing

Stack:

- Astro 6.4.8
- TypeScript
- GitHub Pages
- Google Sheets
- Google Drive
- Static site generation

Repository:

- Branch: `master`
- Base path: `/ripple-bakes-makes`

---

# Development Philosophy

Keep:

- Static Astro architecture
- Simple business maintenance workflow
- Free solutions
- Clear separation of data and presentation
- Single source of truth for every type of content

Avoid:

- Unnecessary backend complexity
- Duplicate data systems
- Manual technical maintenance

Core principle:

```
Business Data
      +
Business Assets
      |
      v
RIPPLE Content Pipeline
      |
      v
Static Website
```

---

# RIPPLE Architecture

RIPPLE uses Google Workspace as the business content backend.

## Google Sheets — Business Database

Contains structured business data:

- Products
- Collections
- Product Options
- Forms
- Future Orders
- Future Inventory

---

## Google Drive — Asset Database

Contains business assets:

```
RIPPLE/

├── Assets/
│
├── Orders/
│
├── Inventory/
│
└── Documents/
```

Assets include:

- Product images
- Collection images
- Homepage images
- Business area images
- Logo and branding
- Marketing materials

---

# RIPPLE Content Pipeline

The Content Pipeline connects business data and website generation.

Architecture:

```
Google Sheets
      |
      |
      +----------------+
                       |
                       v

              RIPPLE Content Pipeline

                       ^
                       |
                       |

Google Drive
      |
      |
      +----------------+

                       |
                       v

             Generated Website Data

                       |
                       v

              Astro Static Website

                       |
                       v

              GitHub Pages
```

Responsibilities:

- Import business data
- Sync assets
- Validate content
- Generate website data
- Prepare static deployment

---

# Completed Milestones

## v1.0 — Foundation

Status:

✅ Completed

Implemented:

- Astro static website
- GitHub Pages deployment
- Bakery and Sewing structure
- Initial website architecture

---

## v1.5 — Content Data Pipeline

Status:

✅ Completed

Implemented:

- Google Sheets integration
- Import pipeline
- Data normalization
- Dynamic content generation

---

## v1.6 — RIPPLE Branding

Status:

✅ Completed

Implemented:

- Brand migration
- Logo system
- Favicon system
- Header and footer branding

---

## v1.7 — Product Configuration

Status:

✅ Completed

Implemented:

- Product option system
- Dynamic customization support
- Form data integration

---

## v1.9 — Product Experience

Status:

✅ Completed

Implemented:

- Product image architecture
- Product galleries
- Product detail pages
- Collection presentation
- Homepage storefront experience
- Featured products
- Inquiry-based customer flow

---

# Current Development

# v1.10 — RIPPLE Content Pipeline

Status:

🚧 Current

Goal:

Create a complete business-managed content workflow using Google Workspace.

RIPPLE uses two separate business databases:

```
Google Sheets
      |
      | Business Data
      |

Google Drive
      |
      | Business Assets
      |

RIPPLE Content Pipeline
      |
      v

Astro Static Website
```

Principles:

- Google Sheets manages structured business data
- Google Drive manages website assets
- Astro remains a static website
- No manual website content maintenance
- No backend required

---

# v1.10.1 — Google Drive Asset Workspace

Status:

✅ Completed

Goal:

Create the Google Drive asset structure that will become the RIPPLE Asset Database.

Implemented:

- Dedicated RIPPLE business workspace
- Assets folder structure
- Product image organization
- Branding asset locations
- Marketing asset locations
- Future business operation folders

Structure:

```
RIPPLE/

├── Assets/
│
├── Orders/
│
├── Inventory/
│
└── Documents/
```

---

# v1.10.1.1 — Product Image Organization

Status:

✅ Completed

Goal:

Create a human-friendly and pipeline-friendly product image structure.

Final structure:

```
Product Images/

├── Bakery/
│
│   ├── Filled Pockets/
│   │   └── BK-FP-001/
│   │
│   ├── Flat Breads/
│   │   └── BK-FB-001/
│   │
│   └── Sourdough Breads/
│       └── BK-SB-001/
│
└── Sewing/

    ├── Bucket Hats/
    │   └── SW-BH-001/
    │
    ├── Custom Shirts/
    │   └── SW-CS-001/
```

Design rule:

Human folders:

```
Bucket Hats
Filled Pockets
Custom Shirts
```

are for browsing only.

System folders:

```
SW-BH-001
BK-FP-001
SW-CS-001
```

are the identifiers used by the pipeline.

---

# v1.10.2 — Google Drive Asset Import

Status:

⏳ Planned

Goal:

Connect Google Drive assets to the RIPPLE Content Pipeline.

Architecture:

```
Google Drive

      |
      v

Drive Asset Importer

      |
      v

Generated Website Assets

      |
      v

Astro Build
```

---

## v1.10.2.1 — Google Drive Integration Review

Status:

⏳ Next

Goal:

Analyze the existing Google integration and prepare the Drive importer design.

Tasks:

- Review existing Google Service Account setup
- Identify reusable authentication code
- Review current pipeline architecture
- Define Drive API integration points
- Define asset synchronization strategy

No implementation changes until architecture approval.

---

## v1.10.2.2 — Google Drive Asset Import Implementation

Status:

⏳ Planned

Goal:

Implement Google Drive asset synchronization.

Capabilities:

- Connect to Google Drive
- Read Assets folder
- Discover product images
- Match Product IDs
- Download assets during build
- Generate local website assets

Example:

Google Drive:

```
Product Images/

Bakery/

Filled Pockets/

BK-FP-001/

01.jpg
02.jpg
```

Generated:

```
public/images/products/BK-FP-001/

01.jpg
02.jpg
```

---

# RIPPLE v1.10.3 — Unified Business Asset & Update Pipeline ✅

## Objective

Transform RIPPLE from a developer-maintained static site into a business-maintained content system.

The owner manages:

- Google Sheets → business data
- Google Drive → images and assets

A single command synchronizes and rebuilds the website.

---

## Completed

### Unified Update Command

Created:


---

# 10. Final Owner Workflow

Business owner:

1. Add products in Google Sheets
2. Add images in Google Drive
3. Run:

npm run update


Result:

Website updated.


---

# Completion Criteria

v1.10.3 is complete when:

✓ Product assets sync  
✓ Collection assets sync  
✓ Homepage assets sync  
✓ Business area assets sync  
✓ Logo/favicon sync  
✓ Sheets sync  
✓ One-command update works  
✓ Final validation report generated  
✓ Astro build succeeds

---

# v1.10 Completion Criteria

Completed when:

✅ Google Drive is the asset source of truth  
✅ Product images sync automatically  
✅ Existing Astro image system continues working  
✅ No manual public asset management required  
✅ Google Sheets + Google Drive work together as RIPPLE business databases  

---

# Future Architecture

Final RIPPLE Content Pipeline:

```
Google Sheets
      |
      | Business Data
      |
      +----------------+
                       |
                       v

              RIPPLE Content Pipeline

                       ^
                       |
                       |

Google Drive
      |
      | Business Assets

                       |
                       v

             Astro Static Website

                       |
                       v

              GitHub Pages
```
---

# Future Development

# v2.0 — Inquiry & Ordering Workflow

Status:

⏳ Future

Goal:

Create a simple customer inquiry and order management workflow.

Data separation:

```
Catalog Data

Google Sheets
    |
    |
Products
Collections
Options


Transaction Data

Google Sheets
    |
    |
Orders
Order Items
Status Tracking
```

Possible additions:

- Email notifications
- Customer communication workflow
- Order status management

---

# Future v2.x Improvements

Possible improvements:

- Inventory tracking
- Availability management
- Customer history
- Analytics
- Business workflow tools

Only add complexity when business needs require it.

---

# Permanent Project Rules

## Single Source of Truth

| Content | Source |
|---|---|
| Product information | Google Sheets |
| Collection information | Google Sheets |
| Product options | Google Sheets |
| Forms | Google Sheets |
| Product images | Google Drive |
| Collection images | Google Drive |
| Homepage images | Google Drive |
| Logos | Google Drive |
| Favicons | Google Drive |
| Marketing assets | Google Drive |
| Orders | Google Sheets (future) |
| Inventory | Google Sheets (future) |

---

## Editing Rules

Never manually edit generated website content.

Flow:

```
Google Workspace

        |
        v

RIPPLE Content Pipeline

        |
        v

Generated Website

        |
        v

GitHub Pages
```

---

# Current Architecture Supports

```
Google Sheets
      |
      |
Business Data
      |
      |
      +----------------+
                       |
                       v

              RIPPLE Content Pipeline

                       ^
                       |
                       |

Google Drive
      |
      |
Business Assets

                       |
                       v

             Astro Static Website

                       |
                       v

              GitHub Pages
```