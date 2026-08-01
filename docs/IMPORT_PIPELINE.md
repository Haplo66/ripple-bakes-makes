# RIPPLE Data Pipeline

The RIPPLE Data Pipeline reads product, collection, and form data from Google Sheets (or CSV files as a local fallback) and generates the JSON files consumed by the Astro website.

The website reads from:

- `src/content/products.json`
- `src/content/collections.json`
- `src/content/forms.json`

## Folder Structure

```text
data/import/
  collections.csv
  products.csv
  forms.csv
  collections.sample.csv
  products.sample.csv
  forms.sample.csv

scripts/pipeline/
  import-data.ts          Main import orchestrator
  update-site.ts          Full update orchestration (assets + data + build)
  reader.ts               Input adapter factory (CSV or Google Sheets)
  csv-reader.ts           CSV file reader
  sheets-reader.ts        Google Sheets API reader
  sheets-auth.ts          Sheets API authentication (read-only)
  sheets-writer.ts        Sheets write-back for generated Product IDs
  drive-auth.ts           Drive API authentication
  drive-write-auth.ts     Drive write-scoped authentication
  drive-product-image-importer.ts  Drive → local asset sync (products, collections, etc.)
  drive-gallery-image-importer.ts  Drive → local gallery image sync
  drive-fix-image-extensions.ts    Repair missing file extensions
  validators.ts           Required-field validation
  normalizers.ts          Data normalization and type mapping
  product-ids.ts          Auto-generation of blank Product IDs
  generators.ts           JSON output generation
  image-scanner.ts        Dynamic filesystem image discovery
  image-resolver.ts       Image fallback hierarchy resolution
  logger.ts               Pipeline logging
  types.ts                Shared TypeScript types
  constants.ts            File paths, sheet tab names, pipeline metadata
```

## Workflow

### Production (Google Sheets API)

The GitHub Actions workflow sets `SHEETS_ENABLED=true` and reads data directly from Google Sheets. The spreadsheet ID is provided via the `INVENTORY_GOOGLE_SHEETS_ID` environment variable.

### Local Development (CSV fallback)

1. Export sheet tabs as CSV files.
2. Copy the exports to `data/import/`.
3. Run `npm run import:data`.

### Full Update

`npm run update` runs the complete pipeline:

1. **Validate environment** — checks required env vars
2. **Repair Drive image extensions** — fixes files missing extensions in Drive
3. **Import Drive assets** — syncs product, collection, business-area, homepage images from Drive to `public/images/`
4. **Import Gallery Images** — syncs gallery images from Drive `Assets/Gallery Images/{Personal,Bakery,Sewing}/` to `public/images/gallery/{category}/`
5. **Import Google Sheets data** — reads collections, products, forms from Sheets (or CSV fallback) → generates JSON to `src/content/` (also scans gallery folder for `gallery-assets.json`)
6. **Validate generated content** — checks for missing images, descriptions, empty datasets
7. **Build website** — runs `astro build`

Missing CSV files (when using CSV mode) are reported as warnings. The pipeline continues processing any files that are present.

## CSV Schemas

### `collections.csv`

Required columns:

- `id`
- `businessArea`
- `name`

Supported columns:

```text
id,businessArea,code,slug,name,subtitle,shortDescription,description,imageFolder,heroImage,featured,status,displayOrder,imageTone,galleryCaptions,popularIdeas,customizationNote
```

`galleryCaptions` and `popularIdeas` should be JSON arrays.

`code` (Collection Code) is a 2-letter code used to auto-generate Product IDs (e.g. `BK-CA-001`). It is recommended for every collection. When blank, the pipeline derives the code from an existing product ID in the same collection.

### `products.csv`

Required columns:

- `businessArea`
- `collection`
- `name`

The `id` column is **optional**. Blank Product IDs are auto-generated (see below).

Supported columns:

```text
id,businessArea,collection,category,slug,name,subtitle,shortDescription,description,status,featured,homepageFeatured,galleryFeatured,imageFolder,formId,image,imageTone,active,displayOrder,price,priceLabel
```

Additional notes:
- `homepageFeatured` controls homepage spotlight placement, independent of `featured`.
- `galleryFeatured` controls gallery page visibility. Defaults to `true`. Set `false` to exclude a product from the gallery without affecting its product page.
- `price` is a numeric value. When empty, the product displays as Coming Soon.
- `imageFolder` and `image` fields are overridden at build time by the image resolver.

### Auto-generated Product IDs

The Product ID column is **system-managed** — the owner does not create or maintain IDs. During import, any row with a blank `id` gets a generated ID in the `{BA}-{Collection Code}-{NNN}` family (e.g. `BK-CA-001`):

1. The collection's 2-letter `code` is looked up from the Collections dataset.
2. If the collection has no code, the code is derived from an existing product ID in the same collection (e.g. `SW-ST-002` → `ST`).
3. The next free sequence number is computed across all products.
4. In Sheets mode (`SHEETS_ENABLED=true`), the generated ID is written back to the Products worksheet so the sheet stays the source of truth. In CSV mode, the ID stays in memory for this run only.
5. If no code can be determined, a warning is emitted and the row is skipped.

Existing Product IDs are never modified or reused, and no other sheet columns are touched by the write-back.

Note: the Products worksheet must have a `Product ID` header column for write-back to work. If the column is missing, the pipeline reports `Product ID column not found` and the generated IDs are used in-memory for the current run only.

### `forms.csv`

Forms use a **row-per-field** format. Each row defines one field belonging to a form.

Required columns:

- `formId`
- `fieldName`

Supported columns:

```text
formId,formName,fieldName,fieldType,values,required
```

- `formId` / `Form ID`: groups rows into a single form definition
- `formName` / `Form Name`: display name for the form (taken from the first row of each group)
- `fieldName` / `Field Name`: display label for the field
- `fieldType` / `Field Type`: input type (`dropdown`, `textbox`, `select`, `text`, `textarea`, `number`, `checkbox`, `radio`, `multiselect`)
- `values` / `Values`: pipe-delimited option values for choice fields (e.g. `Vanilla|Chocolate|Lemon`)
- `required` / `Required`: whether the field is required (`Yes`/`No`)

All rows with the same `formId` are grouped into one form record with an ordered `fields` array.

## Sample Files

The `.sample.csv` files in `data/import/` are generated from the current project data. They are committed as living documentation and can be copied over the working CSV files for local testing.

## Validation Rules

The pipeline validates required fields. Invalid rows are skipped, and warnings include:

- file
- row number
- column
- reason

Required fields per dataset:

| Dataset | Required Fields |
|---------|----------------|
| collections | `id`, `businessArea`, `name` |
| products | `businessArea`, `collection`, `name` (`id` is optional and auto-generated) |
| forms (row-per-field) | `formId`, `fieldName`, `fieldType` |
| forms (JSON fields column) | `id`, `name` |

The import does not abort because one row is invalid.

## Generated JSON Format

Each generated JSON file uses this wrapper:

```json
{
  "_metadata": {
    "generated": true,
    "generatedAt": "ISO_TIMESTAMP",
    "source": "RIPPLE Data Pipeline",
    "version": 1
  },
  "data": []
}
```

Astro loaders read from `json.data`. The loaders also tolerate a plain root-array format for backward compatibility.

## Troubleshooting

If a dataset is empty:
- **Google Sheets mode**: confirm the sheet tab name matches `SHEET_TABS` in `constants.ts` and the spreadsheet ID is correct.
- **CSV mode**: confirm the corresponding CSV file exists in `data/import/`.

If a row is skipped, check the warning for the missing required field.

If the website build fails after import, check whether a required display column such as `slug`, `description`, or `fields` was accidentally removed.

If images are not appearing, verify the product folder exists in `public/images/products/{BA}/{Collection}/{Product Name}/` and that `npm run import:assets` or `npm run update` has been run to sync from Drive.
