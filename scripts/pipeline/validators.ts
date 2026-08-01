/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import type { CsvRecord, DatasetName, PipelineWarning } from './types.ts';

const requiredFields: Record<DatasetName, string[]> = {
  collections: ['id', 'businessArea', 'name'],
  products: ['businessArea', 'collection', 'name'],
  forms: ['formId', 'fieldName', 'fieldType'],
};

const getRequiredFields = (
  dataset: DatasetName,
  records: CsvRecord[],
): string[] => {
  if (dataset === 'forms' && records.length > 0) {
    const firstValues = records[0].values;

    if ('fields' in firstValues) {
      return ['id', 'name'];
    }

    if ('fieldName' in firstValues || 'Field Name' in firstValues) {
      return ['formId', 'fieldName', 'fieldType'];
    }

    return [];
  }

  return requiredFields[dataset];
};

export const validateRecords = (
  dataset: DatasetName,
  file: string,
  records: CsvRecord[],
  warnings: PipelineWarning[],
): CsvRecord[] => {
  const fields = getRequiredFields(dataset, records);

  return records.filter((record) => {
    const missing = fields.filter(
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
};
