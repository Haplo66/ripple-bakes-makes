import type { DatasetName, PipelineWarning } from './types.ts';
import { readCsvFile, type CsvReadResult } from './csv-reader.ts';
import { authenticateSheets } from './sheets-auth.ts';
import { readSheet } from './sheets-reader.ts';
import { IMPORT_FILES } from './constants.ts';

export type DatasetReader = {
  read(
    dataset: DatasetName,
    warnings: PipelineWarning[],
  ): Promise<CsvReadResult> | CsvReadResult;
};

export function createReader(): DatasetReader {
  if (process.env.SHEETS_ENABLED === 'true') {
    return createSheetsReader();
  }

  return createCsvReader();
}

function createCsvReader(): DatasetReader {
  return {
    read(dataset, warnings) {
      const fileName = IMPORT_FILES[dataset];
      return readCsvFile(fileName, warnings);
    },
  };
}

function createSheetsReader(): DatasetReader {
  let sheetsClient: Promise<ReturnType<typeof authenticateSheets> | null> | null = null;

  return {
    async read(dataset, warnings) {
      if (!sheetsClient) {
        sheetsClient = authenticateSheets().catch((error: Error) => {
          warnings.push({
            file: 'Google Sheets',
            reason: `Authentication failed: ${error.message}`,
          });
          return null;
        });
      }

      const sheets = await sheetsClient;

      if (!sheets) {
        return { found: false, records: [] };
      }

      const spreadsheetId = process.env.GOOGLE_SHEETS_ID || '';

      return readSheet(dataset, sheets, spreadsheetId, warnings);
    },
  };
}
