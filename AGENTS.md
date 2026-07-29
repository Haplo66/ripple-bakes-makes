# RIPPLE Bakes & Makes Development Guidelines

## Project Philosophy
This is a premium artisan small business website.
Do not create generic AI-looking designs.

The feeling should be:
- handmade
- warm
- trustworthy
- professional

## Technology Constraints
- Astro static site
- GitHub Pages deployment
- No paid services
- No server backend
- Maintain build compatibility

## Before Editing
Always:
1. Inspect existing files
2. Explain planned changes
3. Preserve existing functionality

## Design Rules
Use:
- warm colors
- generous spacing
- elegant typography
- subtle animations

Avoid:
- excessive gradients
- AI-style cards everywhere
- unnecessary frameworks
- overengineering

## Doctor — Health Checks

Run: `npm run doctor`

Generates:
- Console report (stdout)
- Markdown report (`scripts/doctor/reports/doctor-report.md`)
- Full JSON report (`scripts/doctor/reports/doctor-report.json`)
- Owner JSON report (`scripts/doctor/reports/doctor-report-owner.json`)
- Dashboard at `/doctor` (reads owner report at build time)

### Email Automation

The Doctor can send health reports by email via the Apps Script Web App (same endpoint used for orders and inquiries).

**Local setup:**
```bash
# Set environment variables before running Doctor
$env:PUBLIC_SUBMISSION_ENDPOINT="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
$env:PUBLIC_ORDER_TOKEN="your-shared-secret"
npm run doctor
```

If email is not configured, Doctor skips delivery and reports:
```
ℹ Email delivery skipped - not configured (set Doctor Enabled = Yes in Doctor Config sheet)
```

**GitHub Actions (`.github/workflows/doctor.yml`):**
- Manual trigger (`workflow_dispatch`)
- Weekly schedule (Monday 08:00 UTC)
- Set secrets in GitHub repository: `PUBLIC_SUBMISSION_ENDPOINT`, `PUBLIC_ORDER_TOKEN`

**Doctor Config Sheet:**
- Enable/disable and recipient settings are managed in the `Doctor Config` sheet tab of the **Orders Spreadsheet**.
- Requires `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, and `ORDERS_GOOGLE_SHEETS_ID` env vars for Sheets access.