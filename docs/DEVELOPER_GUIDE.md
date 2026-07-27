# RIPPLE Developer Guide

## Environment

### Node

- Node.js 22 or later
- npm comes bundled with Node

### .env Setup

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

### Environment Variables

| Variable | Required For | Purpose |
|---|---|---|
| `SHEETS_ENABLED` | Data import | Set to `true` to read from Google Sheets API directly. Omit or set to `false` to use CSV files in `data/import/`. |
| `INVENTORY_GOOGLE_SHEETS_ID` | Sheets API mode | Spreadsheet ID from the Google Sheet URL (the long string between `/d/` and `/edit`). |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Sheets API + Drive import | Service account email for Google Cloud API authentication. |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Sheets API + Drive import | Service account private key. Must have `\n` escaped on a single line. |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | Drive asset import | Root folder ID for the RIPPLE Business Data folder in Google Drive. The importer navigates from this root into `Assets/` and its subfolders. |
| `PUBLIC_SUBMISSION_ENDPOINT` | Order and inquiry submission | Google Apps Script Web App URL for receiving all submissions. Without this, the mock provider is used (no data written to Sheets). |
| `PUBLIC_ORDER_TOKEN` | Order submission | Shared secret that must match the `TOKEN` constant in the Apps Script project. Optional but recommended. |

Environment variables prefixed with `PUBLIC_` are exposed to client-side code via `import.meta.env`. The rest are server-side only.

## Development

### Install

```bash
npm install
```

### Run dev server

```bash
npm run dev
```

Starts the Astro development server with hot reload.

### Full update (data + assets + build)

```bash
npm run update
```

Runs the complete pipeline: validate environment, repair Drive image extensions, import Drive assets, import Google Sheets data, validate generated content, build the site.

### Build only

```bash
npm run build
```

Builds the static site from the current generated JSON in `src/content/`. Output goes to `dist/`.

### Data import only

```bash
npm run import:data
```

Reads data from Google Sheets (if `SHEETS_ENABLED=true`) or CSV files (fallback) and generates JSON to `src/content/`.

### Asset import only

```bash
npm run import:assets
```

Syncs images from Google Drive to `public/images/` using the configured root folder.

### Preview built site

```bash
npm run preview
```

Serves the built `dist/` folder locally.

## Pipeline Architecture

### Data Pipeline

```
Google Sheets (SHEETS_ENABLED=true)
  or
data/import/*.csv (local fallback)
       |
       v
  reader.ts          -- selects CSV reader or Sheets API reader
       |
       v
  validators.ts      -- checks required fields per dataset
       |
       v
  normalizers.ts     -- maps sheet values to typed records,
                        parses booleans, numbers, JSON arrays,
                        groups row-per-field forms by formId
       |
       v
  image-resolver.ts  -- scans public/images/ for product,
                        collection, and business-area images,
                        applies fallback hierarchy
       |
       v
  generators.ts      -- sorts by id, wraps in metadata JSON,
                        writes to src/content/*.json
```

Generated JSON is written to `src/content/` with a metadata wrapper:

```json
{
  "_metadata": {
    "generated": true,
    "generatedAt": "2026-07-22T18:59:25.378Z",
    "source": "RIPPLE Data Pipeline",
    "version": 1
  },
  "data": []
}
```

The website reads these files through typed loader modules in `src/data/`.

### Asset Pipeline

```
Google Drive
  Assets/
    Product Images/     -- one subfolder per product ID (e.g. BK-CH-001)
    Collection Images/  -- category banners
    Homepage Images/    -- hero banners
    Business Area Images/  -- bakery / sewing imagery
    Logo and Symbol/    -- brand logos
    Favicon/            -- browser icons
       |
       v
  drive-product-image-importer.ts
       |
       v
  public/images/
    products/<ProductID>/  -- 01.jpg, 02.jpg, ...
    collections/
    business-areas/
    home/
    logo/
```

The image scanner (`image-scanner.ts`) discovers images dynamically from the filesystem at import time. There is no hard-coded image list or limit. The resolver (`image-resolver.ts`) applies a fallback hierarchy:

1. Product folder (`public/images/products/<ProductID>/`)
2. Collection folder (`public/images/collections/<collectionId>/`)
3. Business-area folder (`public/images/business-areas/<code>/`)
4. Default placeholder (warning logged)

### Image Extension Repair

Drive occasionally strips file extensions. The `drive-fix-image-extensions.ts` script detects these and appends the correct extension before import.

### Order Submission

Orders flow from the client-side checkout page to a Google Apps Script Web App:

```
Checkout page
       |
       v
  appsScriptSubmissionProvider (fetch POST)
       |
       v
  Google Apps Script Web App
       |
       ├── Orders sheet
       ├── Order Items sheet
       └── Email notification to owner
```

The submission provider is auto-selected: if `PUBLIC_SUBMISSION_ENDPOINT` is set, the Apps Script provider is used; otherwise the mock provider handles submissions locally.

## GitHub Actions

The workflow file is `.github/workflows/deploy.yml`.

### Triggers

| Trigger | When |
|---|---|
| `push` to `master` | On every commit to the default branch |
| `workflow_dispatch` | Manual trigger from GitHub Actions UI or API |
| `schedule` (cron `0 8 * * *`) | Daily at ~midnight Pacific Time |

### Steps

1. Checkout repository
2. Setup Node 22
3. Install dependencies (`npm ci`)
4. Configure environment from repository secrets (writes `.env` with `SHEETS_ENABLED=true`)
5. Run `npm run update` (validate, repair extensions, import Drive assets, import Sheets data, validate content, build)
6. Upload `dist/` as a Pages artifact
7. Deploy to GitHub Pages

### Required Repository Secrets

| Secret | Source |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google Cloud service account |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Google Cloud service account |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | Drive folder URL |
| `INVENTORY_GOOGLE_SHEETS_ID` | Sheet URL |
| `PUBLIC_SUBMISSION_ENDPOINT` | Apps Script deployment URL |
| `PUBLIC_ORDER_TOKEN` | Shared secret |

## Troubleshooting

### Missing Products

- Verify the product row exists in the Products sheet tab.
- Check that the `id`, `businessArea`, `collection`, and `name` columns are filled.
- Check that `active` is set to `true`.
- Run `npm run update` and watch for validation warnings.
- If using CSV mode, confirm the file exists at `data/import/products.csv`.

### Missing Images

- Verify a folder exists in Drive under `Assets/Product Images/` named with the exact Product ID.
- Run `npm run import:assets` or `npm run update` to sync from Drive.
- Check the image files are `.jpg` or `.png` and have file extensions.
- Run the extension repair script: `npm run drive:fix-extensions` then re-import.
- The image resolver logs a warning for any product using the default placeholder.

### Products Displaying as Coming Soon

- The product's `price` column is empty. Add a numeric price.
- Price `0` is valid and makes the product purchasable.
- If the product should not be orderable, leave the price empty — it will display as Coming Soon.

### Dataset Empty

- **Sheets mode**: verify `INVENTORY_GOOGLE_SHEETS_ID` is correct and the sheet tab name matches (`Collections`, `Products`, `Forms`).
- **CSV mode**: verify the corresponding CSV file exists in `data/import/`.

### Validation Warnings

| Warning | Likely Cause | Fix |
|---|---|---|
| `Product X is using default image` | No images found for the product | Add images to the product's Drive folder and re-import |
| `Product X missing description` | `shortDescription` column is empty | Add a brief description in the sheet |
| `File is missing; skipping this dataset` | CSV file not found (CSV mode only) | Export the sheet tab as CSV to `data/import/` |
| `Required field is missing` | A required column is empty | Check the warning for the specific row and column |

### Import Fails

- Check `.env` has all required variables set.
- For Drive import errors: verify the service account has access to the Drive folder and `GOOGLE_DRIVE_ROOT_FOLDER_ID` points to the correct folder.
- For Sheets import errors: verify the service account has access to the spreadsheet and `INVENTORY_GOOGLE_SHEETS_ID` is correct.

### Build Fails

- Check that generated JSON files exist in `src/content/`.
- Check the Astro error output for missing page data or invalid references.
- Run `npm run update` for the full workflow. Use `npm run import:data` and `npm run build` separately only when troubleshooting specific stages.
