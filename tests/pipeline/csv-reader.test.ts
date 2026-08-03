/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { readCsvFile } from '../../scripts/pipeline/csv-reader.ts';
import { normalizeProducts } from '../../scripts/pipeline/normalizers.ts';
import type { PipelineWarning } from '../../scripts/pipeline/types.ts';

const IMPORT_DIR = path.resolve('data/import');
const TEST_FILE = 'products.description-test.csv';

const writeTestCsv = (content: string): void => {
  fs.writeFileSync(path.join(IMPORT_DIR, TEST_FILE), content, 'utf-8');
};

after(() => {
  try {
    fs.unlinkSync(path.join(IMPORT_DIR, TEST_FILE));
  } catch {
    // already removed
  }
});

describe('readCsvFile — header normalization', () => {
  it('maps a title-cased Description header to the description key', () => {
    writeTestCsv(
      [
        'Product ID,Business Area,Product Name,Short Description,Description',
        'SW-CS-001,Sewing,Custom Design Shirt,Personalized handmade shirt,Shirt customized with customer-selected theme and design',
      ].join('\n'),
    );
    const warnings: PipelineWarning[] = [];
    const result = readCsvFile(TEST_FILE, warnings);

    assert.strictEqual(result.found, true);
    assert.strictEqual(result.records.length, 1);
    assert.strictEqual(result.records[0].values.description, 'Shirt customized with customer-selected theme and design');
    assert.strictEqual(result.records[0].values.shortDescription, 'Personalized handmade shirt');
  });

  it('survives normalization with the description intact', () => {
    writeTestCsv(
      [
        'Product ID,Business Area,Product Name,Short Description,Description,Collection',
        'BK-CH-001,Bakery,Challah Bread,,A hand-braided loaf made fresh for Shabbat.,Challah Bread',
      ].join('\n'),
    );
    const warnings: PipelineWarning[] = [];
    const result = readCsvFile(TEST_FILE, warnings);
    const normalized = normalizeProducts(result.records);

    assert.strictEqual(normalized[0].description, 'A hand-braided loaf made fresh for Shabbat.');
  });

  it('keeps camelCase headers working as before', () => {
    writeTestCsv(
      [
        'id,businessArea,name,shortDescription,description',
        'P-1,sewing,Test,Short,Long description',
      ].join('\n'),
    );
    const warnings: PipelineWarning[] = [];
    const result = readCsvFile(TEST_FILE, warnings);

    assert.strictEqual(result.records[0].values.shortDescription, 'Short');
    assert.strictEqual(result.records[0].values.description, 'Long description');
  });

  it('reports a missing file as not found', () => {
    const warnings: PipelineWarning[] = [];
    const result = readCsvFile('does-not-exist.csv', warnings);
    assert.strictEqual(result.found, false);
    assert.strictEqual(warnings.length, 1);
  });
});
