# Demo Images

These images are **temporary development/demo assets**.

## Purpose

- Validate the product image pipeline (discovery, fallback, warnings)
- Test UI rendering with actual image files
- Verify fallback hierarchy behavior

## Status

**Replace before production.** These are not real product photography.

## Product Image Coverage

| Product ID | Name | Images (in JSON) | Source |
|---|---|---|---|
| BK-FP-001 | Classic Filled Pocket | 01.jpg–04.jpg | Generated |
| BK-FB-001 | Traditional Flat Bread | 01.jpg, 02.jpg | Generated |
| BK-FP-002 | Chocolate Filled Pocket | 01.jpg | Generated |
| SW-CS-001 | Custom Design Shirt | 01.jpg–05.jpg | Generated |

## Gallery Placeholder Images

| File | Tone | Source |
|---|---|---|
| morning-loaves.jpg | wheat | Generated |
| stitched-care.jpg | sage | Generated |
| autumn-tables.jpg | rose | Generated |
| little-sweetness.jpg | cream | Generated |
| everyday-heirlooms.jpg | sage | Generated |

## Fallback Testing

The following products intentionally have no images to verify the fallback hierarchy:

- BK-FB-002, BK-SB-001, BK-SB-002, SW-CS-002
- SW-BH-001, SW-BH-002, SW-BE-001, SW-BB-001, SW-RP-001

## Generation

- Product images: `scripts/tools/generate-demo-images.ps1`
- Gallery images: generated placeholder images

## Build Note

Run `npm run update` after adding or removing images to regenerate product data and rebuild the site.
