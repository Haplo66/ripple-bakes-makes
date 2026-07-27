# Gallery Test Products

Reference for QA testing gallery scenarios.

| Product ID | Name | Images | Gallery Behaviour | Page Route |
|---|---|---|---|---|
| BK-FP-001 | Classic Filled Pocket | 4 | Full gallery with thumbnail strip | /bakery/filled-pockets/classic-filled-pocket |
| BK-FP-002 | Chocolate Filled Pocket | 1 | Single image, no thumbnails | /bakery/filled-pockets/chocolate-filled-pocket |
| BK-FP-003 | Savory Filled Pocket | 0 | Placeholder fallback panel | /bakery/filled-pockets/savory-filled-pocket |
| BK-CA-001 | Classic Celebration Cake | 2 | Two-image gallery | /bakery/other-bakery/classic-celebration-cake |
| SW-SH-001 | Premium Custom Shirt | 5 | Gallery with thumbnail strip | /sewing/custom-shirts/premium-custom-shirt |
| SW-HAT-001 | Premium Bucket Hat | 3 | Standard gallery | /sewing/bucket-hats/premium-bucket-hat |

## Image Folder Locations

```
public/images/products/
  Bakery/Filled Pockets/Classic Filled Pocket/
    main-classic-filled-pocket.jpg
  Bakery/Filled Pockets/Chocolate Filled Pocket/
    main-chocolate-filled-pocket.jpg
  Bakery/Other Bakery/Classic Celebration Cake/
    main-classic-celebration-cake.jpg
  Sewing/Custom Shirts/Premium Custom Shirt/
    main-premium-custom-shirt.jpg
  Sewing/Bucket Hats/Premium Bucket Hat/
    main-premium-bucket-hat.jpg
```

## QA Checklist

- [ ] BK-FP-001: Thumbnails visible, clicking each switches the main image
- [ ] BK-FP-002: No thumbnail strip, single image displayed
- [ ] BK-FP-003: Placeholder gradient panel, no broken image
- [ ] BK-CA-001: Two thumbnails, switching works
- [ ] SW-SH-001: All thumbnails visible and clickable, no layout breakage
- [ ] SW-HAT-001: 3 thumbnails, standard gallery layout
- [ ] All pages: Responsive at mobile/tablet/desktop widths
- [ ] All pages: `npm run build` succeeds with no errors
