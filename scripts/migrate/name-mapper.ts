import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { google } from 'googleapis';
import type { sheets_v4 } from 'googleapis';
import { PROJECT_ROOT, IMPORT_DIR } from '../pipeline/constants.ts';
import type { MappedData, NameMapping } from './types.ts';

const PRODUCT_ID_PATTERN = /^[A-Z]{2}-[A-Z]{2}-\d{3}$/;

const BUSINESS_AREA_NAMES: Record<string, string> = {
  bakery: 'Bakery',
  sewing: 'Sewing',
  BK: 'Bakery',
  SW: 'Sewing',
};

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

async function authenticateSheets(): Promise<sheets_v4.Sheets> {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!clientEmail) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable.');
  }
  if (!privateKey) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY environment variable.');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

interface CsvRow {
  rowNumber: number;
  values: Record<string, string>;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      value += '"';
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === ',' && !inQuotes) {
      values.push(value);
      value = '';
      continue;
    }

    value += ch;
  }

  values.push(value);
  return values;
}

function readCsvFile(fileName: string): CsvRow[] {
  const filePath = join(IMPORT_DIR, fileName);
  if (!existsSync(filePath)) return [];

  const content = readFileSync(filePath, 'utf8');
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/);
  const [headerLine, ...dataLines] = lines;

  if (!headerLine?.trim()) return [];

  const headers = parseCsvLine(headerLine).map((h) => h.trim());

  return dataLines
    .map((line, idx) => ({ line, rowNumber: idx + 2 }))
    .filter(({ line }) => line.trim().length > 0)
    .map(({ line, rowNumber }) => {
      const cols = parseCsvLine(line);
      const values = headers.reduce<Record<string, string>>((acc, header, idx) => {
        acc[header] = cols[idx]?.trim() ?? '';
        return acc;
      }, {});
      return { rowNumber, values };
    });
}

const PRODUCT_HEADER_MAP: Record<string, string> = {
  'Product ID': 'id',
  'Product Name': 'name',
  'Business Area': 'businessArea',
  Collection: 'collection',
};

const COLLECTION_HEADER_MAP: Record<string, string> = {
  'Collection ID': 'id',
  'Collection Name': 'name',
};

function normalizeHeaders(headers: string[], map: Record<string, string>): string[] {
  return headers.map((h) => map[h] ?? h);
}

async function readSheetTab(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  tabName: string,
): Promise<CsvRow[]> {
  const range = `${tabName}!A:Z`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) return [];

  const [headerRow, ...dataRows] = rows;
  const headers = (headerRow as string[]).map((h: string) => String(h).trim()).filter(Boolean);
  if (headers.length === 0) return [];

  return dataRows
    .filter((row: unknown[]) => (row as unknown[]).some((cell) => String(cell ?? '').trim().length > 0))
    .map((row: unknown[], index: number) => {
      const values: Record<string, string> = {};
      headers.forEach((header, i) => {
        values[header] = String(row[i] ?? '').trim();
      });
      return { rowNumber: index + 2, values };
    });
}

async function readProducts(sheets: sheets_v4.Sheets, spreadsheetId: string): Promise<CsvRow[]> {
  const raw = await readSheetTab(sheets, spreadsheetId, 'Products');
  return raw.map((r) => ({
    ...r,
    values: normalizeHeaders(Object.keys(r.values), PRODUCT_HEADER_MAP).reduce(
      (acc, key, i) => {
        const originalKey = Object.keys(r.values)[i];
        acc[key] = r.values[originalKey] ?? '';
        return acc;
      },
      {} as Record<string, string>,
    ),
  }));
}

async function readCollections(sheets: sheets_v4.Sheets, spreadsheetId: string): Promise<CsvRow[]> {
  const raw = await readSheetTab(sheets, spreadsheetId, 'Collections');
  return raw.map((r) => ({
    ...r,
    values: normalizeHeaders(Object.keys(r.values), COLLECTION_HEADER_MAP).reduce(
      (acc, key, i) => {
        const originalKey = Object.keys(r.values)[i];
        acc[key] = r.values[originalKey] ?? '';
        return acc;
      },
      {} as Record<string, string>,
    ),
  }));
}

function readLocalCsv(dataset: string): CsvRow[] {
  return readCsvFile(`${dataset}.csv`);
}

export async function buildNameMappings(): Promise<MappedData> {
  const spreadsheetId = process.env.INVENTORY_GOOGLE_SHEETS_ID;

  let productRows: CsvRow[];
  let collectionRows: CsvRow[];

  if (spreadsheetId) {
    try {
      const sheets = await authenticateSheets();
      productRows = await readProducts(sheets, spreadsheetId);
      collectionRows = await readCollections(sheets, spreadsheetId);
      console.log(`  Products: ${productRows.length} rows from Google Sheets`);
      console.log(`  Collections: ${collectionRows.length} rows from Google Sheets`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`  Sheets read failed (${message}), falling back to CSV`);
      productRows = readLocalCsv('products');
      collectionRows = readLocalCsv('collections');
      console.log(`  Products: ${productRows.length} rows from CSV`);
      console.log(`  Collections: ${collectionRows.length} rows from CSV`);
    }
  } else {
    productRows = readLocalCsv('products');
    collectionRows = readLocalCsv('collections');
    console.log(`  Products: ${productRows.length} rows from CSV`);
    console.log(`  Collections: ${collectionRows.length} rows from CSV`);
  }

  const collectionLookup = new Map<string, NameMapping>();
  for (const row of collectionRows) {
    const rawSlug = row.values.id?.trim();
    const name = row.values.name?.trim();
    if (rawSlug && name) {
      const slug = slugify(rawSlug);
      collectionLookup.set(slug, { name, slug: slugify(name) });
    }
  }

  const products = new Map<string, NameMapping>();
  const collections = new Map<string, NameMapping>();
  const businessAreas = new Map<string, NameMapping>();
  const collectionSlugToCode = new Map<string, string>();
  const areaSlugToCode = new Map<string, string>();

  for (const row of productRows) {
    const productCode = row.values.id?.trim();
    const productName = row.values.name?.trim();
    const areaSlug = row.values.businessArea?.trim().toLowerCase();
    const collectionSlug = slugify(row.values.collection ?? '');

    if (!productCode || !PRODUCT_ID_PATTERN.test(productCode)) continue;

    if (productName) {
      products.set(productCode, { name: productName, slug: slugify(productName) });
    }

    const collectionCode = productCode.replace(/-\d+$/, '');
    if (collectionSlug && !collections.has(collectionCode)) {
      const collName = collectionLookup.get(collectionSlug)?.name;
      if (collName) {
        collections.set(collectionCode, { name: collName, slug: slugify(collName) });
        collectionSlugToCode.set(collectionCode, collectionSlug);
      }
    }

    const areaCode = productCode.substring(0, 2);
    if (areaSlug && !businessAreas.has(areaCode)) {
      const areaName = BUSINESS_AREA_NAMES[areaSlug];
      if (areaName) {
        businessAreas.set(areaCode, { name: areaName, slug: slugify(areaName) });
        areaSlugToCode.set(areaSlug, areaCode);
      }
    }
  }

  console.log(`  Product mappings: ${products.size}`);
  console.log(`  Collection mappings: ${collections.size}`);
  console.log(`  Business area mappings: ${businessAreas.size}`);

  return { products, collections, businessAreas, collectionSlugToCode, areaSlugToCode };
}
