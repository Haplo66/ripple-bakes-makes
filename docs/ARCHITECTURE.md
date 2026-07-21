# Honeycomb Arts & Bakes
## Version 2 Architecture

This document describes the long-term architecture of the Honeycomb Arts & Bakes website.

The website is intentionally designed as a static Astro application that can be hosted on GitHub Pages without requiring a backend.

---

# Guiding Principles

The architecture should remain:

- modular
- reusable
- data-driven
- strongly typed
- static-site compatible
- easy to extend
- easy to maintain

Avoid duplicated layouts, duplicated components and hardcoded business logic.

Business content belongs in data files.

UI components should remain generic.

---

# Architecture

Category
    ↓
Collection
    ↓
Product
    ↓
Form Definition
    ↓
Shopping Cart
    ↓
Checkout Order

Each layer has one responsibility.

---

# Category

Examples:

Bakery

Sewing

Categories organize collections.

---

# Collection

Examples:

Cakes

Cookies

Custom Sewing

Rice Packs

A Collection:

- belongs to one Category
- contains Products
- owns collection-level content
- has one landing page

Collection pages are generated dynamically.

Example:

/bakery/cakes

---

# Product

Examples:

Birthday Cake

Wedding Cake

Adult T-Shirt

Hoodie

Products belong to exactly one Collection.

Products own:

- title
- description
- images
- future pricing
- future availability
- Form Definition

Product pages are generated dynamically.

Example:

/bakery/cakes/birthday-cake

---

# Form Definition

Forms are configuration driven.

Products reference a Form Definition.

The rendering engine never contains business-specific logic.

Supported field types:

- text
- textarea
- dropdown
- checkbox
- radio
- number
- date

Future support:

- image upload
- color picker
- file upload

---

# Shopping Cart

The cart stores Products.

Each cart item contains:

- Product
- Quantity
- Configuration
- Notes

No payment processing.

---

# Checkout

Checkout collects:

Customer Information

Order Summary

Preferred Contact

Preferred Pickup

The checkout generates a structured order suitable for email submission.

No backend.

---

# Data Location

Business content belongs inside:

src/data/

Examples:

collections.ts

products.ts

forms.ts

---

# Components

Components should remain generic.

Good examples:

CollectionCard

CollectionDetail

ProductDetail

DynamicForm

FieldRenderer

Avoid:

CakeForm

ShirtForm

CookiePage

---

# Routing

Collection:

/category/collection

Product:

/category/collection/product

No manually created product pages.

Everything should be generated.

---

# Design Rules

Prefer:

Composition

Reusable components

Small functions

Clear naming

TypeScript types

Avoid:

Large components

Duplicated layouts

Business logic inside UI

Hardcoded content

---

# Future Expansion

The architecture should support:

Pricing

Inventory

Availability

Email ordering

CMS

Payment

without requiring major architectural changes.