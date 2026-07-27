# RIPPLE Business Workflow

How to keep your website up to date.

---

## Business Data

Your website content — products, collections, and forms — is managed in **Google Sheets**.

You can edit the spreadsheet directly on Google Drive:

- Add new products
- Update prices or descriptions
- Change product availability
- Organise into collections
- Set which products appear on the homepage
- Define order forms and customization fields

The website reads from these sheets when you publish. You never need to touch code or files.

---

## Business Assets

Your website images are managed in **Google Drive**.

The folder structure mirrors the business areas:

```
Assets/
├── Product Images/      → {Business Area}/{Collection}/{Product}/
│   ├── Bakery/
│   │   ├── Challah Bread/
│   │   │   ├── Challah Bread/     (product images)
│   │   │   └── Mini Challah Bread/
│   │   └── Filled Pockets/
│   │       └── Cheese Filled Pocket/
│   └── Sewing/
│       ├── Baby Blankets/
│       │   └── Custom Baby Blanket/
│       └── ...
├── Collection Images/   → {Business Area}/{Collection}/ banners
├── Homepage Images/     → Hero banners
├── Business Area Images/ → Bakery / Sewing imagery
├── Gallery Images/     → Gallery-only photos (Personal/)
├── Logo and Symbol/     → Brand logos
└── Favicon/             → Browser icons
```

Product images go inside a three-level folder: Business Area → Collection → Product. The system discovers images by scanning the folder hierarchy automatically — there is no need to use codes or IDs in folder names.

---

## Daily Workflow

### Update the Website

Make your changes in Google Sheets or Google Drive, then run:

```
npm run update
```

This single command does everything:

1. Checks the environment is ready
2. Repairs any image files missing their file extension
3. Downloads new or changed images from Drive
4. Imports the latest data from Sheets
5. Validates everything is in order
6. Builds the website

When it finishes, your website is up to date.

### What You See

The command will show each step as it runs:

```
── Step 1: Validate Environment ──
── Step 2: Repair Drive Image Extensions ──
── Step 3: Import Drive Assets ──
── Step 4: Import Google Sheets Data ──
── Step 5: Validate Generated Content ──
── Step 6: Build Website ──
```

If something needs attention, you will see a warning. The website will still build, but you should check the warning message.

### About Product Prices

- **With a price** (any number, including `0`) — the product can be added to the cart and ordered.
- **Without a price** (empty cell) — the product shows a "Coming Soon" label on the website and cannot be ordered.
- The `price` column must contain numbers only (e.g. `45`). Use the `priceLabel` column for display text like "From $45".

### About Featured Products

The spreadsheet has two featured columns that work independently:

- **`featured`** — controls which products are highlighted in featured sections throughout the site (collection pages, business area pages).
- **`homepageFeatured`** — controls which products appear in the spotlight section on the homepage.

Neither flag controls whether a product is listed on the site — only `active` does that. A product can be featured, homepage-featured, both, or neither.

---

## Adding a Product

### 1. Add the product in Google Sheets

Fill in a new row in the **Products** tab with the product details.

### 2. Add images in Google Drive

Create a folder inside `Assets/Product Images/` following the business area and collection hierarchy — the product name matching the product you added.

For example:

```
Assets/
└── Product Images/
    └── Sewing/
        └── Bucket Hats/
            └── Premium Bucket Hat/
                ├── main-premium-bucket-hat.jpg
                └── premium-bucket-hat-side.jpg
```

- The folder hierarchy is Business Area → Collection → Product Name
- The system discovers images by scanning the folder structure — no codes or IDs needed
- Image files starting with `main-` are used as the primary product photo

### 3. Update the website

```
npm run update
```

Your new product will appear on the site with its images.

---

## Image Guidelines

For best results:

- Use `.jpg` or `.png` files
- Name them in order: `01.jpg`, `02.jpg`, `03.jpg`, and so on
- The first image (alphabetically) is the main product photo
- There is no limit on the number of images per product

---

## Understanding Warnings

These messages do not stop the update. They let you know something might need attention.

| Warning | What it means |
|---------|---------------|
| *Product is using default image* | No product image was found. A placeholder will be shown on the website. Add images to the product folder in Drive. |
| *Missing description* | The product has no description in the spreadsheet. Add one so customers know what it is. |
| *Form ID is missing* | The product does not have an order form assigned. Customers will still be able to order it, but no customization form will be shown. |
| *Product has no price* | The product will display as "Coming Soon" on the website. Add a price to make it orderable. |

---

## If Something Goes Wrong

The update will stop at the first error and show what went wrong. Common issues:

- **Environment variables missing** — the `.env` file needs to be set up with your Google account details
- **Drive folder not found** — make sure the Assets folder exists in your Google Drive and the service account has access
- **Build failed** — check the error message above. Most build errors are caused by missing images or invalid data in the spreadsheet

For persistent issues, contact your developer.
