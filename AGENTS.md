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

The Doctor can send health reports by email via SMTP.

**Local setup:**
```bash
# Set environment variables before running Doctor
$env:DOCTOR_EMAIL_ENABLED="true"
$env:DOCTOR_EMAIL_TO="owner@example.com"
$env:DOCTOR_EMAIL_FROM="doctor@example.com"
$env:DOCTOR_SMTP_USER="doctor@example.com"
$env:DOCTOR_SMTP_SECRET="app-password"
npm run doctor
```

If email is not configured, Doctor skips delivery and reports:
```
ℹ Email delivery skipped - not configured (set DOCTOR_EMAIL_ENABLED=true)
```

**GitHub Actions (`.github/workflows/doctor.yml`):**
- Manual trigger (`workflow_dispatch`)
- Weekly schedule (Monday 08:00 UTC)
- Set secrets in GitHub repository: `DOCTOR_EMAIL_ENABLED`, `DOCTOR_EMAIL_TO`, `DOCTOR_EMAIL_FROM`, `DOCTOR_SMTP_HOST`, `DOCTOR_SMTP_PORT`, `DOCTOR_SMTP_USER`, `DOCTOR_SMTP_SECRET`

**Google Workspace SMTP:**
1. Enable 2FA on the Google account
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Set `DOCTOR_SMTP_HOST=smtp.gmail.com`, `DOCTOR_SMTP_PORT=587`
4. Use the full email address as `DOCTOR_SMTP_USER` and the App Password as `DOCTOR_SMTP_SECRET`