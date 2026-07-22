import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { IMPORT_DIR } from './constants.ts';
import type { CsvRecord, PipelineWarning } from './types.ts';

export interface CsvReadResult {
  found: boolean;
  records: CsvRecord[];
}

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === ',' && !inQuotes) {
      values.push(value);
      value = '';
      continue;
    }

    value += character;
  }

  values.push(value);
  return values;
};

const parseCsv = (content: string): CsvRecord[] => {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/);
  const [headerLine, ...dataLines] = lines;

  if (!headerLine?.trim()) {
    return [];
  }

  const headers = parseCsvLine(headerLine).map((header) => header.trim());

  return dataLines
    .map((line, index) => ({ line, rowNumber: index + 2 }))
    .filter(({ line }) => line.trim().length > 0)
    .map(({ line, rowNumber }) => {
      const columns = parseCsvLine(line);
      const values = headers.reduce<Record<string, string>>((record, header, index) => {
        record[header] = columns[index]?.trim() ?? '';
        return record;
      }, {});

      return { rowNumber, values };
    });
};

export const readCsvFile = (
  fileName: string,
  warnings: PipelineWarning[],
): CsvReadResult => {
  const filePath = path.join(IMPORT_DIR, fileName);

  if (!existsSync(filePath)) {
    warnings.push({
      file: fileName,
      reason: 'File is missing; skipping this dataset.',
    });
    return { found: false, records: [] };
  }

  return { found: true, records: parseCsv(readFileSync(filePath, 'utf8')) };
};
