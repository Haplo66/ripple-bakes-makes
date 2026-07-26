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
# Required: Google Apps Script Web App URL
PUBLIC_ORDER_ENDPOINT=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Optional: Shared secret for Apps Script token validation
PUBLIC_ORDER_TOKEN=your-shared-secret
```

- Without `PUBLIC_ORDER_ENDPOINT`, the mock provider is used (no data written to Sheets).
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
7. Copy the Web App URL — this is your `PUBLIC_ORDER_ENDPOINT`
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
| `PUBLIC_ORDER_ENDPOINT` | Apps Script Web App URL for order submission |
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

All three publishing methods use the same pipeline:

| Method | Trigger | When to Use |
|---|---|---|
| `push` to master | Automatic on commit | Code changes requiring a deploy |
| Manual **Run workflow** | Browser click | Immediate publish after content changes |
| Scheduled (daily) | Automatic at midnight PT | Regular content sync

---

## Testing

### Prerequisites

- Apps Script deployed and `PUBLIC_ORDER_ENDPOINT` set in `.env`
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
| "Could not reach the order service" | Wrong endpoint URL | Verify `PUBLIC_ORDER_ENDPOINT` is the full Web App URL |
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
