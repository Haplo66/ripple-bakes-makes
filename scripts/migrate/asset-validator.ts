import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { authenticateDrive } from '../pipeline/drive-auth.ts';
import { authenticateSheets } from '../pipeline/sheets-auth.ts';
import { readSheet } from '../pipeline/sheets-reader.ts';
import { findChildFolder, listDriveItems, DRIVE_FOLDER_MIME } from './drive-renamer.ts';
import type { sheets_v4 } from 'googleapis';
import { readCsvFile } from '../pipeline/csv-reader.ts';
import { MANIFEST_DIR } from '../pipeline/constants.ts';
import type { CsvRecord, PipelineWarning } from '../pipeline/types.ts';

const HEADER = 'RIPPLE Asset Validation';
const ALLOWED_IMAGE = /\.(jpg|jpeg|png|webp)$/i;
const PRODUCT_ID_PATTERN = /^[A-Z]{2}-[A-Z]{2}-\d{3}$/;
const BA_SLUG_TO_NAME: Record<string, string> = {
  bakery: 'Bakery',
  sewing: 'Sewing',
};

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

type DriveClient = Awaited<ReturnType<typeof authenticateDrive>>;

interface ValidationItem {
  name: string;
  code?: string;
  status: 'ok' | 'warning' | 'error';
  message?: string;
}

interface ValidationReport {
  _metadata: { generatedAt: string; tool: string; source: string };
  businessAreas: ValidationItem[];
  collections: ValidationItem[];
  products: ValidationItem[];
  summary: { total: number; ok: number; warnings: number; errors: number };
}

interface SheetRow {
  id: string;
  name: string;
  businessArea: string;
  status: string;
  active: string;
  collection?: string;
}

function toSheetRows(records: CsvRecord[]): SheetRow[] {
  return records.map(r => ({
    id: (r.values.id || r.values['Product ID'] || '').trim(),
    name: (r.values.name || r.values['Product Name'] || r.values['Collection Name'] || '').trim(),
    businessArea: (r.values.businessArea || r.values['Business Area'] || '').trim().toLowerCase(),
    status: (r.values.status || r.values['Status'] || r.values['Collection Status'] || 'Active').trim(),
    active: (r.values.active || r.values['Active'] || 'true').trim(),
    collection: (r.values.collection || r.values['Collection'] || '').trim(),
  }));
}

function isImageFile(item: { mimeType: string; name: string }): boolean {
  return item.mimeType !== DRIVE_FOLDER_MIME && ALLOWED_IMAGE.test(item.name);
}

function printItem(item: ValidationItem): void {
  const icon = item.status === 'ok' ? '✓' : item.status === 'warning' ? '⚠' : '✗';
  const code = item.code ? ` (${item.code})` : '';
  const msg = item.message ? ` — ${item.message}` : '';
  console.log(`  ${icon} ${item.name}${code}${msg}`);
}

async function resolveAssetsRoot(drive: DriveClient, rootId: string): Promise<string> {
  const assetsId = await findChildFolder(drive, rootId, 'Assets');
  if (!assetsId) throw new Error('Could not find "Assets" folder under the root.');
  return assetsId;
}

async function findAllFoldersRecursive(drive: DriveClient, folderId: string): Promise<Map<string, string>> {
  const folderMap = new Map<string, string>();
  const queue = [folderId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = await listDriveItems(drive, currentId);
    for (const child of children) {
      if (child.mimeType === DRIVE_FOLDER_MIME) {
        if (!folderMap.has(child.name)) {
          folderMap.set(child.name, child.id);
        }
        queue.push(child.id);
      }
    }
  }

  return folderMap;
}

async function run(): Promise<void> {
  console.log(HEADER);
  console.log('');

  const folderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!folderId) {
    console.error('Missing GOOGLE_DRIVE_ROOT_FOLDER_ID environment variable.');
    process.exit(1);
  }

  console.log('Connecting to Google Drive...');
  let drive: DriveClient;
  try {
    drive = await authenticateDrive();
    console.log('  Connected');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  Authentication failed: ${message}`);
    process.exit(1);
  }
  console.log('');

  console.log('Locating Assets...');
  let assetsId: string;
  try {
    assetsId = await resolveAssetsRoot(drive, folderId);
    console.log('  Found');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  Failed: ${message}`);
    process.exit(1);
  }
  console.log('');

  // ── Read source data from Google Sheets (with CSV fallback) ──
  console.log('Reading source data...');
  const pw: PipelineWarning[] = [];
  const spreadsheetId = process.env.INVENTORY_GOOGLE_SHEETS_ID;

  let productRecords: CsvRecord[] = [];
  let collectionRecords: CsvRecord[] = [];
  let dataSource = '';

  if (spreadsheetId) {
    try {
      const sheets = await authenticateSheets();
      const prodResult = await readSheet('products', sheets, spreadsheetId, pw);
      const collResult = await readSheet('collections', sheets, spreadsheetId, pw);
      if (prodResult.found && collResult.found) {
        productRecords = prodResult.records;
        collectionRecords = collResult.records;
        dataSource = 'Google Sheets';
        console.log('  Source: Google Sheets');
      }
    } catch {
      // fall through to CSV
    }
  }

  if (!dataSource) {
    const prodCsv = readCsvFile('products.csv', pw);
    const collCsv = readCsvFile('collections.csv', pw);
    if (!prodCsv.found || !collCsv.found) {
      console.error('  Could not read products/collections from Sheets or CSV.');
      process.exit(1);
    }
    productRecords = prodCsv.records;
    collectionRecords = collCsv.records;
    dataSource = 'CSV';
    console.log('  Source: CSV (offline)');
  }

  // Parse into normalized row format
  const productRows = toSheetRows(productRecords);
  const collectionRows = toSheetRows(collectionRecords);

  // Build slugified collection ID → name lookup (same slugify as name-mapper.ts)
  const collIdToName = new Map<string, string>();
  for (const r of collectionRows) {
    if (r.id && r.name) collIdToName.set(slugify(r.id), r.name);
  }

  // Filter to active products with valid product codes
  const activeProducts = productRows
    .filter(r => {
      if (!PRODUCT_ID_PATTERN.test(r.id)) return false;
      const status = r.status || 'Active';
      const active = r.active || 'true';
      return status.toLowerCase() === 'active' && active.toLowerCase() === 'true';
    })
    .filter(p => p.id && p.name);

  // Derive Business Areas from products
  const baSeen = new Set<string>();
  const expectedBas: string[] = [];
  for (const p of activeProducts) {
    const baName = BA_SLUG_TO_NAME[p.businessArea] || p.businessArea;
    if (!baSeen.has(baName)) {
      baSeen.add(baName);
      expectedBas.push(baName);
    }
  }

  // Derive Collections from products (unique collection slugs → display names)
  const collSeen = new Set<string>();
  const expectedColls: { name: string; slug: string }[] = [];
  for (const p of activeProducts) {
    const collSlug = slugify(p.collection || '');
    if (!collSlug || collSeen.has(collSlug)) continue;
    collSeen.add(collSlug);
    const collName = collIdToName.get(collSlug);
    if (collName) {
      expectedColls.push({ name: collName, slug: collSlug });
    }
  }

  console.log(`  Products (active, valid ID): ${activeProducts.length}`);
  console.log(`  Collections (from products): ${expectedColls.length}`);
  console.log(`  Business Areas:              ${expectedBas.length}`);
  console.log('');

  const report: ValidationReport = {
    _metadata: { generatedAt: new Date().toISOString(), tool: HEADER, source: 'Google Sheets (CSV)' },
    businessAreas: [],
    collections: [],
    products: [],
    summary: { total: 0, ok: 0, warnings: 0, errors: 0 },
  };

  // ── Business Areas ──
  console.log('── Business Areas ──');
  console.log('');

  const baSectionId = await findChildFolder(drive, assetsId, 'Business Area Images');

  if (!baSectionId) {
    console.log('  ✗ Business Area Images (section folder not found)');
    report.businessAreas.push({ name: 'Business Area Images', status: 'error', message: 'section folder not found' });
  } else {
    const baFolders = (await listDriveItems(drive, baSectionId))
      .filter(f => f.mimeType === DRIVE_FOLDER_MIME);
    const existingBaNames = new Set(baFolders.map(f => f.name));

    for (const name of expectedBas.sort()) {
      if (existingBaNames.has(name)) {
        const item: ValidationItem = { name, status: 'ok' };
        report.businessAreas.push(item);
        printItem(item);
      } else {
        const item: ValidationItem = { name, status: 'error', message: 'missing images folder' };
        report.businessAreas.push(item);
        printItem(item);
      }
    }
  }
  console.log('');

  // ── Collections ──
  console.log('── Collections ──');
  console.log('');

  const collSectionId = await findChildFolder(drive, assetsId, 'Collection Images');

  if (!collSectionId) {
    console.log('  ✗ Collection Images (section folder not found)');
    report.collections.push({ name: 'Collection Images', status: 'error', message: 'section folder not found' });
  } else {
    const topLevel = await listDriveItems(drive, collSectionId);
    const existingCollNames = new Set<string>();
    for (const entry of topLevel) {
      if (entry.mimeType !== DRIVE_FOLDER_MIME) continue;
      // Check if this is a BA subfolder with nested collections
      const children = await listDriveItems(drive, entry.id);
      const subfolders = children.filter(c => c.mimeType === DRIVE_FOLDER_MIME);
      if (subfolders.length > 0) {
        for (const sf of subfolders) existingCollNames.add(sf.name);
      } else {
        existingCollNames.add(entry.name);
      }
    }

    for (const coll of expectedColls.sort((a, b) => a.name.localeCompare(b.name))) {
      if (existingCollNames.has(coll.name)) {
        const item: ValidationItem = { name: coll.name, code: coll.slug, status: 'ok' };
        report.collections.push(item);
        printItem(item);
      } else {
        const item: ValidationItem = { name: coll.name, code: coll.slug, status: 'warning', message: 'missing images folder' };
        report.collections.push(item);
        printItem(item);
      }
    }
  }
  console.log('');

  // ── Products ──
  console.log('── Products ──');
  console.log('');

  const prodSectionId = await findChildFolder(drive, assetsId, 'Product Images');

  if (!prodSectionId) {
    console.log('  ✗ Product Images (section folder not found)');
    report.products.push({ name: 'Product Images', status: 'error', message: 'section folder not found' });
  } else {
    const allProductFolders = await findAllFoldersRecursive(drive, prodSectionId);

    // Cache folder contents for image checks
    const folderContentsCache = new Map<string, Awaited<ReturnType<typeof listDriveItems>>>();
    async function getFolderContents(folderId: string) {
      if (!folderContentsCache.has(folderId)) {
        folderContentsCache.set(folderId, await listDriveItems(drive, folderId));
      }
      return folderContentsCache.get(folderId)!;
    }

    for (const product of activeProducts.sort((a, b) => a.id.localeCompare(b.id))) {
      const folderName = product.name;

      if (!allProductFolders.has(folderName)) {
        const item: ValidationItem = {
          name: product.name,
          code: product.id,
          status: 'warning',
          message: 'missing images folder',
        };
        report.products.push(item);
        printItem(item);
        continue;
      }

      const folderId = allProductFolders.get(folderName)!;
      const contents = await getFolderContents(folderId);
      const images = contents.filter(isImageFile);

      if (images.length === 0) {
        const item: ValidationItem = {
          name: product.name,
          code: product.id,
          status: 'warning',
          message: 'no images',
        };
        report.products.push(item);
        printItem(item);
      } else {
        const item: ValidationItem = { name: product.name, code: product.id, status: 'ok' };
        report.products.push(item);
        printItem(item);
      }
    }
  }
  console.log('');

  // ── Summary ──
  for (const cat of [report.businessAreas, report.collections, report.products]) {
    for (const item of cat) {
      report.summary.total++;
      if (item.status === 'ok') report.summary.ok++;
      else if (item.status === 'warning') report.summary.warnings++;
      else report.summary.errors++;
    }
  }

  console.log('── Summary ──');
  console.log('');
  console.log(`  Total:   ${report.summary.total}`);
  console.log(`  OK:      ${report.summary.ok}`);
  console.log(`  Warning: ${report.summary.warnings}`);
  console.log(`  Error:   ${report.summary.errors}`);
  console.log('');

  mkdirSync(MANIFEST_DIR, { recursive: true });
  const reportPath = join(MANIFEST_DIR, 'asset-validation-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`Report saved: ${reportPath}`);
}

await run();
