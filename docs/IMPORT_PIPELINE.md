# Honeycomb Data Pipeline

The Honeycomb Data Pipeline turns manually exported Google Sheets CSV files into the JSON files consumed by the Astro website.

The website continues to read:

- `src/data/products.json`
- `src/data/collections.json`
- `src/data/forms.json`

Only the generation process changes.

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
  import-data.ts
  csv-reader.ts
  validators.ts
  normalizers.ts
  generators.ts
  logger.ts
  types.ts
  constants.ts
```

## Workflow

1. Update the Google Sheet.
2. Export each sheet tab as CSV.
3. Copy the exports to `data/import/`.
4. Run `npm run import:data`.
5. Run `npm run build`.

Missing CSV files are reported as warnings. The pipeline continues processing any files that are present.

## CSV Schemas

### `collections.csv`

Required columns:

- `id`
- `businessArea`
- `name`

Supported columns:

```text
id,businessArea,slug,name,subtitle,shortDescription,description,imageFolder,heroImage,featured,status,displayOrder,imageTone,galleryCaptions,popularIdeas,customizationNote
```

`galleryCaptions` and `popularIdeas` should be JSON arrays.

### `products.csv`

Required columns:

- `id`
- `businessArea`
- `collection`
- `name`
- `formId`

Supported columns:

```text
id,businessArea,collection,category,slug,name,subtitle,shortDescription,description,status,featured,imageFolder,formId,image,imageTone,active,displayOrder,priceLabel
```

### `forms.csv`

Required columns:

- `id`
- `name`

Supported columns:

```text
id,name,description,fields
```

`fields` should be a JSON array matching the existing form field structure.

## Sample Files

The `.sample.csv` files in `data/import/` are generated from the current project data. They are committed as living documentation and can be copied over the working CSV files for local testing.

## Validation Rules

The pipeline validates required fields only in v1. Invalid rows are skipped, and warnings include:

- file
- row number
- column
- reason

The import does not abort because one row is invalid.

## Generated JSON Format

Each generated JSON file uses this wrapper:

```json
{
  "_metadata": {
    "generated": true,
    "generatedAt": "ISO_TIMESTAMP",
    "source": "Honeycomb Data Pipeline",
    "version": 1
  },
  "data": []
}
```

Astro loaders read from `json.data`, while still tolerating the previous root-array format.

## Troubleshooting

If a dataset is empty, confirm the corresponding CSV exists in `data/import/`.

If a row is skipped, check the warning for the missing required field.

If JSON-array columns fail, confirm the CSV cell contains valid JSON and quotes are escaped correctly by the spreadsheet export.

If the website build fails after import, check whether a required display column such as `slug`, `description`, or `fields` was accidentally removed even though the v1 validator only enforces source-of-truth identity fields.

## Future Google Sheets API Integration

The pipeline is intentionally split into stages:

- input adapter: `csv-reader.ts`
- validation: `validators.ts`
- normalization: `normalizers.ts`
- output generation: `generators.ts`

A future Google Sheets API adapter should produce the same normalized record input shape as the CSV reader. Validation, normalization, sorting, metadata, and JSON generation should not need to change.
