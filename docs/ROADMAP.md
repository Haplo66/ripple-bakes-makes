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

Create a complete business-managed content workflow using Google Sheets and Google Drive.

---

## v1.10.1 — Google Drive Asset Structure

Status:

⏳ Planned

Goal:

Move all website assets into Google Drive.

Asset structure:

```
Assets/

├── Product Images/
│   ├── Bakery/
│   └── Sewing/
│
├── Collection Images/
│
├── Homepage Images/
│   ├── Hero/
│   ├── Featured/
│   └── Gallery/
│
├── Business Area Images/
│   ├── Bakery/
│   └── Sewing/
│
├── Shared/
│
├── Logo and Symbol/
│
├── Favicon/
│
└── Marketing/
```

---

## v1.10.2 — Asset Import Pipeline

Status:

⏳ Planned

Goal:

Extend the existing content pipeline to import Google Drive assets.

Capabilities:

- Product image synchronization
- Collection image synchronization
- Homepage asset synchronization
- Branding asset synchronization
- Asset validation

---

## v1.10.3 — Content Validation

Status:

⏳ Planned

Goal:

Improve reliability before deployment.

Validation:

- Missing images
- Missing product assets
- Invalid folders
- Missing required content
- Duplicate assets

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