# RIPPLE Bakes & Makes

A static Astro website for an artisan bakery and handmade studio. Designed for GitHub Pages with no client-side framework or server backend.

## Prerequisites

```bash
cp .env.example .env
```

Fill in the required environment variables (Google service account, Drive folder ID, Sheets ID, order endpoint).

## Run locally

```bash
npm install
npm run dev
```

The site runs at the URL shown by Astro.

## Update content and build

```bash
npm run update
```

This single command:
1. Validates the environment
2. Repairs Drive image file extensions
3. Downloads new or changed images from Google Drive
4. Imports the latest data from Google Sheets
5. Validates generated content
6. Builds the static site to `dist/`

## Deploy to GitHub Pages

1. Push the `master` branch to GitHub.
2. In the repository settings, open **Pages** and set the source to **GitHub Actions**.
3. The included workflow builds and publishes the site on each push to `master`.
4. Publishing also happens automatically every day via a scheduled workflow.
5. The owner can trigger publishing from Google Sheets via the **Publish Website** button.

## Updating content

Content is managed in **Google Sheets** (products, collections, forms) and **Google Drive** (images). Edit the spreadsheet and Drive folders, then run `npm run update` or trigger publishing from GitHub Actions. No code changes needed.

For detailed workflows, see:
- [Business Workflow](docs/BUSINESS_WORKFLOW.md)
- [Order Workflow](docs/ORDER_WORKFLOW.md)
- [Architecture](docs/ARCHITECTURE.md)
