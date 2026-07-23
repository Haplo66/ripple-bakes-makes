# RIPPLE Bakes & Makes — Brand Color Specification

## Purpose

This document defines the official RIPPLE Bakes & Makes brand colors for digital and web implementation.

The palette represents:

- Warm handmade craftsmanship
- Bakery warmth
- Sewing and creative work
- Friendly artisan personality

---

# Primary Colors

## Honey Gold

HEX:
#D9A441

RGB:
rgb(217, 164, 65)

Usage:
- Primary brand accent
- CTA buttons
- Highlights
- Logo accents
- Important actions


## Deep Chocolate Brown

HEX:
#5A3825

RGB:
rgb(90, 56, 37)

Usage:
- Headings
- Navigation
- Body text
- Footer
- Borders

---

# Secondary Colors

## Warm Cream

HEX:
#FFF7E8

RGB:
rgb(255, 247, 232)

Usage:
- Main background
- Cards
- Sections
- Content areas


## Sage Green

HEX:
#8C9B6D

RGB:
rgb(140, 155, 109)

Usage:
- Sewing category accents
- Supporting sections
- Tags
- Decorative elements


## Rose Accent

HEX:
#C9827A

RGB:
rgb(201, 130, 122)

Usage:
- Special collections
- Highlight badges
- Decorative accents

---

# CSS Variables

```css
:root {
  --color-honey: #D9A441;
  --color-cream: #FFF7E8;
  --color-brown: #5A3825;
  --color-sage: #8C9B6D;
  --color-rose: #C9827A;

  --color-primary: var(--color-honey);
  --color-background: var(--color-cream);
  --color-text: var(--color-brown);
}