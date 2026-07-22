import type { sheets_v4 } from 'googleapis';
import type { CsvRecord, DatasetName, PipelineWarning } from './types.ts';
import { SHEET_TABS } from './constants.ts';

export interface SheetsReadResult {
  found: boolean;
  records: CsvRecord[];
}

const rowToRecord = (
  headers: string[],
  row: unknown[],
  rowIndex: number,
): CsvRecord => {
  const values: Record<string, string> = {};

  headers.forEach((header, index) => {
    values[header] = String(row[index] ?? '');
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
      .map((row: unknown[], index: number) => rowToRecord(headers, row, index));

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
