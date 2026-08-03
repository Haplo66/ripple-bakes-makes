/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { google } from 'googleapis';
import type { sheets_v4 } from 'googleapis';
import { SHEET_TABS } from './constants.ts';
import { HEADER_MAP } from './sheets-reader.ts';
import type { GeneratedProductId } from './product-ids.ts';

const COLUMN_LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Matches the normalized header key used for the Product ID column. */
const PRODUCT_ID_HEADER = Object.entries(HEADER_MAP.products).find(
  ([, value]) => value === 'id',
)?.[0];

async function authenticateSheetsWrite(): Promise<sheets_v4.Sheets> {
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
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

const columnLabel = (index: number): string => {
  let value = COLUMN_LABELS;
  const result = [];
  while (index >= 0) {
    result.unshift(value[index % 26]);
    index = Math.floor(index / 26) - 1;
  }
  return result.join('');
};

async function findProductIdColumn(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
): Promise<number | null> {
  const tabName = SHEET_TABS.products;
  const range = `${tabName}!A1:Z1`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const headerRow = response.data.values?.[0] ?? [];
  const index = headerRow.findIndex(
    (cell: string | number | null) =>
      String(cell ?? '').trim() === PRODUCT_ID_HEADER,
  );

  return index >= 0 ? index : null;
}

/**
 * Writes generated Product IDs back to the Products sheet so the sheet remains
 * the source of truth and future publishes reuse the same IDs.
 *
 * Only intended for Sheets mode (`SHEETS_ENABLED=true`). Returns the number of
 * cells updated, or 0 if the column could not be located.
 */
export async function writeGeneratedProductIds(
  updates: GeneratedProductId[],
): Promise<number> {
  if (updates.length === 0) {
    return 0;
  }

  const spreadsheetId = process.env.INVENTORY_GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    throw new Error('INVENTORY_GOOGLE_SHEETS_ID is not set; cannot write Product IDs.');
  }

  const sheets = await authenticateSheetsWrite();
  const columnIndex = await findProductIdColumn(sheets, spreadsheetId);
  if (columnIndex === null) {
    throw new Error('Product ID column not found in the Products sheet.');
  }

  const label = columnLabel(columnIndex);
  const tabName = SHEET_TABS.products;

  let updated = 0;
  for (const { rowNumber, id } of updates) {
    const range = `${tabName}!${label}${rowNumber}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [[id]] },
    });
    updated += 1;
  }

  return updated;
}
