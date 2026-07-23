import type { sheets_v4 } from 'googleapis';
import type { CsvRecord, DatasetName, PipelineWarning } from './types.ts';
import { SHEET_TABS } from './constants.ts';

export interface SheetsReadResult {
  found: boolean;
  records: CsvRecord[];
}

const HEADER_MAP: Record<DatasetName, Record<string, string>> = {
  collections: {
    'Business Area': 'businessArea',
    'Collection ID': 'id',
    'Collection Name': 'name',
  },
  products: {
    'Product ID': 'id',
    'Business Area': 'businessArea',
    'Product Name': 'name',
    'Short Description': 'shortDescription',
    'Collection': 'collection',
    'Form ID': 'formId',
    'Image Folder': 'imageFolder',
    'Price': 'price',
  },
  forms: {
    'Form ID': 'id',
    'Form Name': 'name',
  },
  productOptions: {
    'Product ID': 'productId',
    'Option Name': 'optionName',
    'Option Type': 'optionType',
    'Required': 'required',
    'Display Order': 'displayOrder',
    'Placeholder': 'placeholder',
    'Help Text': 'helpText',
  },
};

const normalizeHeader = (header: string, dataset: DatasetName): string =>
  HEADER_MAP[dataset][header] || header;

const rowToRecord = (
  headers: string[],
  row: unknown[],
  rowIndex: number,
  dataset: DatasetName,
): CsvRecord => {
  const values: Record<string, string> = {};

  headers.forEach((header, index) => {
    const key = normalizeHeader(header, dataset);
    values[key] = String(row[index] ?? '');
  });

  return { rowNumber: rowIndex + 2, values };
};

export async function readSheet(
  dataset: DatasetName,
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  warnings: PipelineWarning[],
): Promise<SheetsReadResult> {
  const sheetId = spreadsheetId || process.env.GOOGLE_SHEETS_ID;

  if (!sheetId) {
    warnings.push({
      file: dataset,
      reason: 'GOOGLE_SHEETS_ID is not set; skipping this dataset.',
    });
    return { found: false, records: [] };
  }

  const tabName = SHEET_TABS[dataset];
  const range = `${tabName}!A:Z`;

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      warnings.push({
        file: `${tabName} (Google Sheets)`,
        reason: 'Sheet tab is empty; skipping this dataset.',
      });
      return { found: false, records: [] };
    }

    const [headerRow, ...dataRows] = rows;
    const headers = headerRow.map((header: unknown) => String(header ?? '').trim()).filter(Boolean);

    if (headers.length === 0) {
      warnings.push({
        file: `${tabName} (Google Sheets)`,
        reason: 'Header row is empty; skipping this dataset.',
      });
      return { found: false, records: [] };
    }

    const records: CsvRecord[] = dataRows
      .filter((row: unknown[]) => row.some((cell) => String(cell ?? '').trim().length > 0))
      .map((row: unknown[], index: number) => rowToRecord(headers, row, index, dataset));

    return { found: true, records };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warnings.push({
      file: `${tabName} (Google Sheets)`,
      reason: `Failed to read sheet: ${message}`,
    });
    return { found: false, records: [] };
  }
}
