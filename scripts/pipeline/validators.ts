import type { CsvRecord, DatasetName, PipelineWarning } from './types.ts';

const requiredFields: Record<DatasetName, string[]> = {
  collections: ['id', 'businessArea', 'name'],
  products: ['id', 'businessArea', 'collection', 'name', 'formId'],
  forms: ['id', 'name'],
};

export const validateRecords = (
  dataset: DatasetName,
  file: string,
  records: CsvRecord[],
  warnings: PipelineWarning[],
): CsvRecord[] =>
  records.filter((record) => {
    const missing = requiredFields[dataset].filter(
      (field) => !record.values[field]?.trim(),
    );

    missing.forEach((field) => {
      warnings.push({
        file,
        rowNumber: record.rowNumber,
        column: field,
        reason: 'Required field is missing.',
      });
    });

    return missing.length === 0;
  });
