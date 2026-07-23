# RIPPLE Bakes & Makes — Typography Specification

## Purpose

This document defines the website typography system for RIPPLE Bakes & Makes.

The typography should communicate:

- Friendly
- Handmade
- Warm
- Playful
- Artisan quality

---

# Website Font System

## Heading Font

Font:
Fredoka

Source:
Google Fonts

Usage:
- Hero titles
- Section headings
- Collection titles
- Product titles

Recommended weights:

600
700

Reason:

Fredoka provides a rounded, friendly appearance that matches the RIPPLE logo personality.

---

## Body Font

Font:
Nunito

Source:
Google Fonts

Usage:

- Paragraphs
- Product descriptions
- About pages
- Forms

Recommended weights:

400
600
700

Reason:

Nunito provides excellent readability while maintaining a soft rounded style.

---

## Decorative Accent Font

Font:
Cookie

Source:
Google Fonts

Usage:

- Decorative phrases
- Special announcements
- Small brand moments

Do not use for:

- Navigation
- Paragraphs
- Buttons

---

# CSS Variables

```css
:root {
  --font-heading: 'Fredoka', sans-serif;
  --font-body: 'Nunito', sans-serif;
  --font-accent: 'Cookie', cursive;
}