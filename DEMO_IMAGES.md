# Demo Product Images

These images are **temporary development/demo assets**.

## Purpose

- Validate the product image pipeline (discovery, fallback, warnings)
- Test UI rendering with actual image files
- Verify fallback hierarchy behavior

## Status

**Replace before production.** These are not real product photography.

## Coverage

| Product ID | Name | Images | Source |
|---|---|---|---|
| BK-FP-001 | Classic Filled Pocket | 01.jpg, 02.jpg | Generated |
| BK-FB-001 | Traditional Flat Bread | 01.jpg, 02.jpg | Generated |
| SW-CS-001 | Custom Design Shirt | 01.jpg, 02.jpg | Generated |

## Fallback Testing

The following products intentionally have no images to verify the fallback hierarchy:

- BK-FP-002, BK-FB-002, BK-SB-001, BK-SB-002, SW-CS-002
- SW-BH-001, SW-BH-002, SW-BE-001, SW-BB-001, SW-RP-001

## Generation

Images were generated via `scripts/tools/generate-demo-images.ps1`.

## Build Note

Run `npm run import:data` after adding or removing images to regenerate product data.
