# RIPPLE Order Workflow

Customer order requests from the website are submitted to Google Workspace through a Google Apps Script Web App endpoint. The owner manages orders directly in Google Sheets.

## Architecture

```
Customer browser
       │
       ▼
Checkout page (static Astro)
       │
       ▼
appsScriptSubmissionProvider (fetch POST to Apps Script)
       │
       ▼
Google Apps Script Web App (doPost)
       │
       ├── Orders Google Sheet
       ├── Order Items Google Sheet
       └── Email notification to owner
```

Only the website needs setup (env vars + Apps Script deployment). Orders flow **outbound** from the website to Sheets. No pipeline changes are needed.

---

## Website Environment Variables

Add to `.env`:

```bash
# Required: Google Apps Script Web App URL (orders + inquiries)
PUBLIC_SUBMISSION_ENDPOINT=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Optional: Shared secret for Apps Script token validation
PUBLIC_ORDER_TOKEN=your-shared-secret
```

- Without `PUBLIC_SUBMISSION_ENDPOINT`, the mock provider is used (no data written to Sheets).
- `PUBLIC_ORDER_TOKEN` must match the `TOKEN` constant in the Apps Script project.
- These are `PUBLIC_` prefixed because they are accessed client-side via `import.meta.env`.

---

## Orders Sheet

**Sheet name:** `Orders`

### Columns

| Column | Type | Required | Description |
|---|---|---|---|
| orderId | string | yes | Auto-generated: `RIP-YYYYMMDD-###` |
| createdAt | string | yes | ISO timestamp of submission |
| customerName | string | yes | Customer full name |
| customerEmail | string | yes | Contact email address |
| customerPhone | string | yes | Contact phone number |
| preferredContactMethod | string | yes | email / phone / text |
| preferredPickupDate | string | yes | Requested pickup date |
| additionalNotes | string | no | Freeform customer notes |
| status | string | yes | Initial value: `Received` |
| totalItems | number | yes | Sum of item quantities |
| totalPrice | number | yes | Sum of all item totals (price × quantity) |

### Example Row

| orderId | createdAt | customerName | customerEmail | customerPhone | preferredContactMethod | preferredPickupDate | additionalNotes | status | totalItems | totalPrice |
|---|---|---|---|---|---|---|---|---|---|---|
| RIP-20260725-001 | 2026-07-25T14:30:00Z | Eyal Tal | eyal@example.com | 555-0100 | email | 2026-07-28 | Red ribbon please | Received | 3 | 120 |

---

## Order Items Sheet

**Sheet name:** `Order Items`

### Columns

| Column | Type | Required | Description |
|---|---|---|---|---|
| orderId | string | yes | FK to Orders.orderId |
| productId | string | yes | Product identifier |
| productTitle | string | yes | Product title at time of order (snapshot) |
| collectionId | string | yes | Collection this product belongs to |
| quantity | number | yes | Quantity ordered |
| unitPrice | number | yes | Unit price at time of order |
| totalPrice | number | yes | Price × quantity for this line |
| configuration | string | yes | JSON object of selected option values (cleaned, without product ID prefix) |
| notes | string | no | Per-item custom notes |

### Configuration Format

The `configuration` column stores the customer's selected values as a JSON object using human-readable keys (the `{productId}--` prefix is stripped server-side).

**Good** (stored value):
```json
{"Flavor":"Vanilla","Frosting":"Buttercream","Layers":"3","Custom Message":"Happy Birthday Maya"}
```

### Example Rows for One Order

| orderId | productId | productTitle | collectionId | quantity | unitPrice | totalPrice | configuration | notes |
|---|---|---|---|---|---|---|---|---|
| RIP-20260725-001 | bakery-cakes-birthday-cake | Birthday Cake | bakery-cakes | 1 | 60 | 60 | `{"Flavor":"Vanilla","Frosting":"Buttercream","Size":"8 inch"}` | |
| RIP-20260725-001 | sewing-custom-sewing-adult-t-shirt | Adult T-Shirt | sewing-custom-sewing | 2 | 30 | 60 | `{"Size":"L","Color":"Navy"}` | One for Sarah |

---

## Google Apps Script

Deploy a standalone Apps Script project that receives orders and writes them to Sheets.

### Deployment Steps

1. Open [script.google.com](https://script.google.com)
2. Create a new standalone project
3. Name it e.g. "RIPPLE Order Handler"
4. Paste the script code below
5. Set the configuration constants
6. Deploy: **Deploy > New deployment > Web app**
   - **Execute as:** Me
   - **Who has access:** Anyone
7. Copy the Web App URL — this is your `PUBLIC_SUBMISSION_ENDPOINT`
8. When you update the script, deploy as **New version** (not "Head")

### Configuration

Set these values at the top:

```javascript
const ORDERS_SHEET_NAME = 'Orders';
const ORDER_ITEMS_SHEET_NAME = 'Order Items';
const SPREADSHEET_ID = 'your-google-sheet-id-here';
const NOTIFICATION_EMAIL = 'owner@ripplebakesandmakes.com';
const TOKEN = 'your-shared-secret';
```

- `SPREADSHEET_ID` — from the URL of the Google Sheet containing the Orders and Order Items sheets
- `NOTIFICATION_EMAIL` — the email address that receives new order notifications
- `TOKEN` — must match `PUBLIC_ORDER_TOKEN` in `.env`

### Script Code

```javascript
const ORDERS_SHEET_NAME = 'Orders';
const ORDER_ITEMS_SHEET_NAME = 'Order Items';
const SPREADSHEET_ID = 'your-google-sheet-id-here';
const NOTIFICATION_EMAIL = 'owner@ripplebakesandmakes.com';
const TOKEN = 'your-shared-secret';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    // Validate source
    if (payload.source !== 'ripple-website') {
      return respond(403, { success: false, error: 'Invalid source' });
    }

    // Validate token
    if (payload.token !== TOKEN) {
      return respond(403, { success: false, error: 'Invalid token' });
    }

    const order = payload.order;

    // Validate required fields
    if (!order || !order.items || order.items.length === 0) {
      return respond(400, { success: false, error: 'Order is empty' });
    }

    if (!order.customer || !order.customer.name || !order.customer.email) {
      return respond(400, { success: false, error: 'Customer details required' });
    }

    // Generate order ID (RIP-YYYYMMDD-###)
    const orderId = generateOrderId();

    // Compute totals
    var orderTotal = 0;
    for (var i = 0; i < order.items.length; i++) {
      orderTotal += (order.items[i].totalPrice || 0);
    }

    // Write to Orders sheet
    var ordersSheet = SpreadsheetApp.openById(SPREADSHEET_ID)
      .getSheetByName(ORDERS_SHEET_NAME);
    ordersSheet.appendRow([
      orderId,
      order.createdAt || new Date().toISOString(),
      order.customer.name,
      order.customer.email,
      order.customer.phone || '',
      order.customer.preferredContactMethod || '',
      order.customer.preferredPickupDate || '',
      order.customer.additionalNotes || '',
      'Received',
      order.items.reduce(function(sum, item) { return sum + (item.quantity || 1); }, 0),
      orderTotal,
    ]);

    // Write to Order Items sheet
    var itemsSheet = SpreadsheetApp.openById(SPREADSHEET_ID)
      .getSheetByName(ORDER_ITEMS_SHEET_NAME);
    for (var i = 0; i < order.items.length; i++) {
      var item = order.items[i];
      var itemQuantity = item.quantity || 1;
      itemsSheet.appendRow([
        orderId,
        item.productId,
        item.productTitle,
        item.collectionId,
        itemQuantity,
        item.price || 0,
        item.totalPrice || 0,
        JSON.stringify(item.configuration || {}),
        item.notes || '',
      ]);
    }

    // Build formatted item list for email
    var itemRows = order.items.map(function(item) {
      var lines = [];
      var itemPrice = item.price || 0;
      var itemTotal = item.totalPrice || 0;
      var itemQty = item.quantity || 1;
      lines.push(item.productTitle + ' x' + itemQty + '  \u00a3' + itemTotal.toFixed(2) + ' (\u00a3' + itemPrice.toFixed(2) + ' each)');
      if (item.configuration) {
        var config = item.configuration;
        Object.keys(config).forEach(function(key) {
          var val = config[key];
          var display = Array.isArray(val) ? val.join(', ') : String(val);
          lines.push('  ' + key + ': ' + display);
        });
      }
      if (item.notes) {
        lines.push('  Notes: ' + item.notes);
      }
      return lines.join('\n');
    }).join('\n\n');

    // Send email notification
    MailApp.sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: 'New RIPPLE Order: ' + orderId,
      body: [
        'New order received.',
        '',
        'Order: ' + orderId,
        'Date: ' + (order.customer.preferredPickupDate || 'Not specified'),
        '',
        'Customer:',
        '  Name: ' + order.customer.name,
        '  Email: ' + order.customer.email,
        '  Phone: ' + (order.customer.phone || '—'),
        '  Contact method: ' + (order.customer.preferredContactMethod || '—'),
        '',
        'Items:',
        '',
        itemRows,
        '',
        'Total: \u00a3' + orderTotal.toFixed(2),
        '',
        'Additional notes:',
        '  ' + (order.customer.additionalNotes || 'None'),
        '',
        'View orders: https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID,
      ].join('\n'),
    });

    return respond(200, {
      success: true,
      orderId: orderId,
      message: 'Order received. We will confirm shortly.',
    });

  } catch (err) {
    return respond(500, {
      success: false,
      error: 'Internal error: ' + err.message,
    });
  }
}

function generateOrderId() {
  var now = new Date();
  var date = Utilities.formatDate(now, 'UTC', 'yyyyMMdd');
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
    .getSheetByName(ORDERS_SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  var todayCount = data.filter(function(row) {
    return String(row[0]).startsWith('RIP-' + date);
  }).length;
  var seq = String(todayCount + 1).padStart(3, '0');
  return 'RIP-' + date + '-' + seq;
}

function respond(statusCode, body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Configuration Key Prefix Stripping

Configuration option keys from the website use the pattern `{productId}--{optionName}` (e.g. `SW-CS-001--color`). Before sending to the sheet, the code strips the `{productId}--` prefix so only the human-readable key name remains (`color`). This applies to both the stored JSON and the email display.

### Updating the Script

When you need to modify the script:

1. Edit in the Apps Script editor
2. **Deploy > Manage deployments**
3. Click the pencil icon next to the current deployment
4. Select **New version** from the Version dropdown
5. Click **Deploy**
6. The URL stays the same

---

## Order ID Format

```
RIP-YYYYMMDD-###
```

Examples:
- `RIP-20260725-001` — first order on July 25, 2026
- `RIP-20260725-042` — forty-second order on July 25, 2026

The sequence number resets daily.

---

## Owner Workflow

### Receiving an Order

1. An email arrives: **"New RIPPLE Order: RIP-20260725-001"**
2. Open the Orders sheet to see the new row
3. Initial status is `Received`
4. Review the customer's items and customization in the Order Items sheet

### Managing Order Status

Change the `status` column in the Orders sheet as the order progresses:

```
Received  →  Confirmed  →  Preparing  →  Ready  →  Completed
```

| Status | When to Use |
|---|---|
| `Received` | Order just came in (default) |
| `Confirmed` | You have reviewed and accepted the order |
| `Preparing` | You are actively working on it |
| `Ready` | Ready for customer pickup |
| `Completed` | Customer picked up the order |

To cancel an order, set status to `Cancelled`.

---

## Email Notification Format

When an order is submitted, the owner receives an email:

```
Subject: New RIPPLE Order: RIP-20260725-001

New order received.

Order: RIP-20260725-001
Date: 2026-07-28

Customer:
  Name: Eyal Tal
  Email: eyal@example.com
  Phone: 555-0100
  Contact method: email

Items:

Birthday Cake x1  £60.00 (£60.00 each)
  Flavor: Vanilla
  Frosting: Buttercream
  Size: 8 inch

Adult T-Shirt x2  £60.00 (£30.00 each)
  Size: L
  Color: Navy
  Notes: One for Sarah

Total: £120.00

Additional notes:
  Red ribbon please

View orders: https://docs.google.com/spreadsheets/d/...
```

---

## Owner Publishing Workflow

The owner can publish website updates (products, images, content) without running any commands locally, by triggering a GitHub Actions workflow from the browser.

### Workflow

```
Google Workspace (Sheets + Drive)
        ↓
Owner clicks "Run workflow" on GitHub
        ↓
GitHub Actions: npm run update
        ↓
  ├── Validate environment
  ├── Repair Drive image extensions
  ├── Import Drive assets
  ├── Import Google Sheets data
  ├── Validate generated content
  └── Astro build
        ↓
GitHub Pages deployment
```

### How to Publish

1. Make changes in Google Sheets or Google Drive (products, collections, images, etc.)
2. Go to the GitHub repository: `https://github.com/haplo66/ripple-bakes-makes`
3. Click **Actions** → **Deploy Astro site to GitHub Pages** → **Run workflow**
4. Click the green **Run workflow** button
5. Wait for the workflow to complete (approx. 2–3 minutes)
6. The website is updated at the live URL

### Required GitHub Secrets

These must be configured in the repository: **Settings → Secrets and variables → Actions → Repository secrets**

| Secret | Description |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email for Google API access |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Private key (`\n` escaped, single line — same format as `.env`) |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | Root folder ID for Drive asset import |
| `INVENTORY_GOOGLE_SHEETS_ID` | Google Sheets spreadsheet ID |
| `PUBLIC_SUBMISSION_ENDPOINT` | Apps Script Web App URL for all submissions |
| `PUBLIC_ORDER_TOKEN` | Shared secret for Apps Script validation |

All values must match what is currently in your local `.env` file.

### Safety

- If `npm run update` fails (bad data, missing credentials, build error), the workflow stops immediately and the existing website is **not** affected.
- Only a successful update + build results in a deployment.
- The `push` to `master` trigger also uses `npm run update`, so commits pushed directly to GitHub also deploy fresh content.

### Automatic Daily Publishing

The website also updates automatically every day around midnight Pacific Time (08:00 UTC).

```
Google Workspace (Sheets + Drive)
        ↓
GitHub Actions scheduled workflow (daily)
        ↓
npm run update
        ↓
  ├── Validate environment
  ├── Repair Drive image extensions
  ├── Import Drive assets
  ├── Import Google Sheets data
  ├── Validate generated content
  └── Astro build
        ↓
GitHub Pages deployment
```

If the scheduled run fails, the existing website stays online. No action is needed — the next day's run will retry.

### Sheets Publish Button

The owner can publish directly from Google Sheets without visiting GitHub or running commands.

**How it works:**

```
Google Sheets
  ↓
Custom menu → "Publish Website"
  ↓
Google Apps Script (bound to sheet)
  ↓
GitHub Actions API (workflow_dispatch)
  ↓
Existing deploy workflow (npm run update)
  ↓
GitHub Pages deployment
```

#### Setup

##### Step 1: Create a GitHub Personal Access Token

**Recommended: Fine-grained token**

1. Go to GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Click **Generate new token**
3. Set **Token name:** `RIPPLE Sheets Publisher`
4. Set **Repository access:** Only select repositories → `haplo66/ripple-bakes-makes`
5. Under **Permissions → Repository permissions**, set **Actions → Read and write**
6. Click **Generate token**
7. **Copy the token immediately** — you will not see it again

**Fallback: Classic token** (if fine-grained tokens are unavailable)

1. Go to: **Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Click **Generate new token (classic)**
3. Select the **`public_repo`** scope
4. Generate and copy the token

##### Step 2: Add the Apps Script to the Content Sheet

1. Open the RIPPLE content spreadsheet (the one containing your Products, Collections, Forms sheets)
2. Go to **Extensions → Apps Script**
3. Name the project e.g. `RIPPLE Website Publisher`
4. Replace the default code with the script below
5. Click **Save** (💾 icon)

##### Step 3: Store the GitHub Token

In the Apps Script editor:

1. Click **Project Settings** (⚙ icon)
2. Scroll to **Script Properties**
3. Click **Add script property**
   - **Name:** `GITHUB_TOKEN`
   - **Value:** paste the token from Step 1
4. Click **Save script properties**

##### Step 4: Authorize and Test

1. In the Apps Script editor, select the function **`publishWebsite`** from the dropdown and click **Run** ▶
   - This authorizes the `UrlFetchApp` and `SpreadsheetApp` permissions needed by the script
   - `onOpen` only creates the menu — it does not test the API call
2. You will be prompted to review permissions
   - Click **Review Permissions** → choose your Google account → **Allow**
3. The first run will attempt to call GitHub Actions — check the execution log for success or errors
4. Return to the spreadsheet and refresh the page
5. You should see a **🌐 RIPPLE Website** menu at the top (may take a few seconds to appear after opening the sheet)
6. Click **🌐 RIPPLE Website → Publish Website**
7. A confirmation dialog appears when the workflow starts

#### Script Code

Create a new script bound to the content spreadsheet:

```javascript
/**
 * Adds the RIPPLE Publish menu when the spreadsheet opens.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('\u{1F310} RIPPLE Website')
    .addItem('Publish Website', 'publishWebsite')
    .addToUi();
}

/**
 * Triggers the GitHub Actions workflow_dispatch via API.
 * Uses a Personal Access Token stored in Script Properties.
 */
function publishWebsite() {
  var ui = SpreadsheetApp.getUi();
  var token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');

  if (!token) {
    ui.alert(
      'Token not configured',
      'Set GITHUB_TOKEN in Script Properties:\n' +
      'Extensions > Apps Script > Project Settings > Script Properties',
      ui.ButtonSet.OK
    );
    return;
  }

  var owner = 'haplo66';
  var repo = 'ripple-bakes-makes';
  var workflow = 'deploy.yml';
  var url = 'https://api.github.com/repos/' + owner + '/' + repo + '/actions/workflows/' + workflow + '/dispatches';

  var options = {
    method: 'post',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'Bearer ' + token,
    },
    contentType: 'application/json',
    payload: JSON.stringify({ ref: 'master' }),
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var statusCode = response.getResponseCode();

    if (statusCode === 204) {
      ui.alert(
        'Publishing started',
        'Website update is running (2\u20133 minutes).\n' +
        'Check progress at:\n' +
        'https://github.com/' + owner + '/' + repo + '/actions',
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        'Publishing failed (HTTP ' + statusCode + ')',
        'Check your GITHUB_TOKEN and try again.\n' +
        'Fallback: run the workflow manually at\n' +
        'https://github.com/' + owner + '/' + repo + '/actions',
        ui.ButtonSet.OK
      );
    }
  } catch (err) {
    ui.alert('Error', err.message, ui.ButtonSet.OK);
  }
}
```

#### How to Publish

1. Make changes in Google Sheets or Google Drive
2. In the content spreadsheet, click **🌐 RIPPLE Website → Publish Website**
3. A dialog confirms the workflow has started
4. Verify the workflow was triggered: go to **GitHub → Actions** and confirm a new run is in progress
5. Wait for the workflow to complete (2–3 minutes)
6. Visit the live website to confirm the changes appear
7. The emergency fallback is always available: **GitHub → Actions → Run workflow**

> **Note:** Apps Script has daily quotas for `UrlFetchApp`. Excessive publishing (many times per hour) may hit these limits. Normal usage — a few publishes per day — is well within the free quota.

#### End-to-End Test Results

**Test date:** July 26, 2026

✅ **Owner workflow tested end-to-end:**

```
Google Sheets → Publish Website button → Apps Script → GitHub Actions → Build → Deploy → Website update
```

**Confirmed:**
- Token stored securely in Apps Script Properties
- GitHub API returned HTTP 204 dispatch success
- GitHub Actions workflow triggered via API
- Build job completed:
  - Environment validation
  - Google Drive asset repair
  - Google Drive asset import
  - Google Sheets data import
  - Astro static build
- Deploy job completed successfully
- Website deployment verified

#### Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|---|
| Menu does not appear | Script not authorized, or sheet just opened | Run `publishWebsite` in the editor to trigger permission prompts, then refresh the sheet. The menu may take a few seconds to appear after opening |
| "Token not configured" | GITHUB_TOKEN not set in Script Properties | Add it via Project Settings → Script Properties |
| HTTP 401 or 403 | Token expired or lacks correct permissions | Regenerate the token with Actions: Read and write permission (fine-grained) or `public_repo` scope (classic) |
| HTTP 422 | Invalid `ref` | Must be `master` (the default branch name) |
| Script error | Quota exceeded (UrlFetchApp) | Wait a few minutes and try again. Apps Script has daily fetch limits — normal usage (a few publishes per day) is fine |

All four publishing methods use the same pipeline:

| Method | Trigger | When to Use |
|---|---|---|
| `push` to master | Automatic on commit | Code changes requiring a deploy |
| Manual **Run workflow** | Browser click | Immediate publish after content changes |
| Sheets **Publish Website** | Button click in Google Sheets | Immediate publish without leaving Google Workspace |
| Scheduled (daily) | Automatic at midnight PT | Regular content sync

---

## Testing

### Prerequisites

- Apps Script deployed and `PUBLIC_SUBMISSION_ENDPOINT` set in `.env`
- `PUBLIC_ORDER_TOKEN` set and matches the Apps Script `TOKEN`
- Run `npm run dev` to start the development server

### Test 1 — Single Product

```
1x Challah Bread
```

Steps:
1. Browse to a product (e.g. Challah Bread)
2. Select any options, set quantity to 1
3. Click **Add to cart**
4. Go to cart, click **Checkout**
5. Fill in customer details
6. Click **Prepare order**

Verify:
- [ ] Success confirmation shown
- [ ] Order ID displayed (RIP-YYYYMMDD-001 format)
- [ ] Cart is cleared
- [ ] Orders sheet has one new row
- [ ] Order Items sheet has one new row
- [ ] Email received with order details

### Test 2 — Multiple Products

```
2x Challah Bread
1x Custom Shirt (Theme: Minecraft, Size: Medium)
3x Rice Pack
```

Steps:
1. Add all three products to cart with specified options and quantities
2. Proceed to checkout
3. Fill in customer details
4. Submit

Verify:
- [ ] One order ID for all items
- [ ] Orders sheet: 1 row, totalItems = 6 (2+1+3)
- [ ] Order Items sheet: 3 rows with correct product IDs and quantities
- [ ] Email lists all items with quantities
- [ ] Configuration stored as JSON with human-readable values

### Test 3 — Custom Product with Options

```
Custom Shirt
  Theme: Minecraft
  Color: Blue
  Size: Large
```

Steps:
1. Add Custom Design Shirt to cart
2. Select: Theme = Minecraft, Color = Blue, Size = Large
3. Checkout and submit

Verify:
- [ ] Order Items configuration column contains:
      `{"Theme":"minecraft","Color":"blue","Size":"large"}`
- [ ] Email shows the customization details

### Test 4 — Network Failure

Steps:
1. Add an item to cart
2. Go to checkout
3. Disconnect from the internet (or set wrong endpoint URL)
4. Click **Prepare order**

Verify:
- [ ] Error message shown
- [ ] Retry button visible
- [ ] Cart preserved (items not lost)
- [ ] Can retry after reconnecting

### Test 5 — Empty Cart Prevention

Steps:
1. Go directly to `/checkout` without adding items

Verify:
- [ ] Empty cart message shown
- [ ] Links to browse bakery/sewing displayed
- [ ] Submit button not accessible

---

## Troubleshooting

### Orders Not Appearing in Sheets

| Symptom | Likely Cause | Fix |
|---|---|---|
| No error, but no row in sheet | Wrong `SPREADSHEET_ID` in Apps Script | Verify the ID in the script |
| "Invalid token" error | `PUBLIC_ORDER_TOKEN` doesn't match `TOKEN` in script | Make them identical |
| "Server returned status 0" or opaque response | CORS issue with Apps Script | The provider now handles this — should fall through to success message |
| "Could not reach the order service" | Wrong endpoint URL | Verify `PUBLIC_SUBMISSION_ENDPOINT` is the full Web App URL |
| Sheet names don't match | Sheet tab names differ from `ORDERS_SHEET_NAME` / `ORDER_ITEMS_SHEET_NAME` | Make them match |

### Email Not Received

- Check that `NOTIFICATION_EMAIL` is correct in the Apps Script
- Check spam folder
- Apps Script has daily email quotas (typically 100/day for free accounts)
- Run the script in the Apps Script editor to test: **Run > doPost** with a test payload

### Script Errors

1. Open the Apps Script project
2. Go to **Executions** in the left sidebar
3. View stack traces for failed runs
4. Common issues:
   - Sheet name typo
   - Sheet not created yet
   - Spreadsheet ID invalid

### Token Validation Fails

- Both `PUBLIC_ORDER_TOKEN` (in `.env`) and `TOKEN` (in Apps Script) must be identical strings
- No special encoding needed — plain strings are compared directly

---

## Order ID Format

Orders use a human-readable ID format:

```
RIP-YYYYMMDD-###
```

- `RIP` — constant prefix (RIPPLE)
- `YYYYMMDD` — date of submission
- `###` — zero-padded sequence number, resets daily

Generated by `generateOrderId()` in the Apps Script.

---

## Limitations

- The Apps Script Web App URL must be public. There is no way to keep it secret on a static site.
- The token provides basic access control but can be extracted from the client-side JavaScript.
- Apps Script has daily quotas (emails, Sheets API calls). At low order volumes this is not an issue.
- No built-in retry on the server side. If the Apps Script fails mid-write, some rows may be missing.
