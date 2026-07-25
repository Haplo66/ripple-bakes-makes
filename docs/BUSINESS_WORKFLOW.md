# RIPPLE Business Workflow

How to keep your website up to date.

---

## Business Data

Your website content — products, collections, forms, and options — is managed in **Google Sheets**.

You can edit the spreadsheet directly on Google Drive:

- Add new products
- Update prices or descriptions
- Change product availability
- Organise into collections

The website reads from these sheets automatically. You never need to touch code or files.

---

## Business Assets

Your website images are managed in **Google Drive**.

The folder structure is:

```
Assets/
├── Product Images/      → One folder per product
├── Collection Images/   → Category banners
├── Homepage Images/     → Hero banners
├── Business Area Images/ → Bakery / Sewing imagery
├── Logo and Symbol/     → Brand logos
└── Favicon/             → Browser icons
```

Product images go inside a folder named with the Product ID (for example, `BK-CH-001`). The human-readable category names — like "Challah Bread" or "Filled Pockets" — are there to help you organise. The system finds products by their ID, not by the folder name.

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

---

## Adding a Product

### 1. Add the product in Google Sheets

Fill in a new row in the **Products** tab with the product details.

### 2. Add images in Google Drive

Create a folder inside `Assets/Product Images/` using the correct Product ID.

For example:

```
Assets/
└── Product Images/
    └── Sewing/
        └── Bucket Hats/
            └── SW-HS-001/
                ├── 01.jpg
                └── 02.jpg
```

- Human-readable folder names are for your convenience — they help you stay organised
- The Product ID folder name (like `SW-HS-001`) is what the system uses to connect the images to the product
- Name your image files `01.jpg`, `02.jpg`, `03.jpg`, and so on

### 3. Update the website

```
npm run update
```

Your new product will appear on the site with its images.

---

## Image Guidelines

For best results:

- Use `.jpg` or `.png` files
- Name them in order: `01.jpg`, `02.jpg`, `03.jpg`
- Maximum 5 images per product
- The first image (`01.jpg`) is the main product photo

---

## Understanding Warnings

These messages do not stop the update. They let you know something might need attention.

| Warning | What it means |
|---------|---------------|
| *Product is using default image* | No product image was found. A placeholder will be shown on the website. Add images to the product folder in Drive. |
| *Missing description* | The product has no description in the spreadsheet. Add one so customers know what it is. |
| *Form ID is missing* | The product does not have an order form assigned. Customers will not be able to order it online. |

---

## If Something Goes Wrong

The update will stop at the first error and show what went wrong. Common issues:

- **Environment variables missing** — the `.env` file needs to be set up with your Google account details
- **Drive folder not found** — make sure the Assets folder exists in your Google Drive and the service account has access
- **Build failed** — check the error message above. Most build errors are caused by missing images or invalid data in the spreadsheet

For persistent issues, contact your developer.
