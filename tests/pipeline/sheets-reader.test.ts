/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readSheet } from '../../scripts/pipeline/sheets-reader.ts';
import { normalizeProducts } from '../../scripts/pipeline/normalizers.ts';
import { createGeneratedJson } from '../../scripts/pipeline/generators.ts';
import type { PipelineWarning } from '../../scripts/pipeline/types.ts';

type SheetsMock = {
  spreadsheets: {
    values: {
      get: (params: { spreadsheetId: string; range: string }) => Promise<{
        data: { values?: unknown[][] };
      }>;
    };
  };
};

const makeSheets = (values: unknown[][]): SheetsMock => ({
  spreadsheets: {
    values: {
      get: async () => ({ data: { values } }),
    },
  },
});

const warnings: PipelineWarning[] = [];

describe('readSheet — product header mapping', () => {
  it('maps the Description column to the description key', async () => {
    const sheets = makeSheets([
      ['Product ID', 'Business Area', 'Product Name', 'Short Description', 'Description'],
      ['SW-CS-001', 'Sewing', 'Custom Design Shirt', 'Personalized handmade shirt', 'Shirt customized with customer-selected theme and design'],
    ]);

    const result = await readSheet('products', sheets as never, 'spreadsheet-id', warnings);

    assert.strictEqual(result.found, true);
    assert.strictEqual(result.records.length, 1);
    assert.strictEqual(result.records[0].values.description, 'Shirt customized with customer-selected theme and design');
  });

  it('continues mapping the Short Description column to shortDescription', async () => {
    const sheets = makeSheets([
      ['Product ID', 'Business Area', 'Product Name', 'Short Description', 'Description'],
      ['SW-CS-001', 'Sewing', 'Custom Design Shirt', 'Personalized handmade shirt', 'Shirt customized with customer-selected theme and design'],
    ]);

    const result = await readSheet('products', sheets as never, 'spreadsheet-id', warnings);

    assert.strictEqual(result.records[0].values.shortDescription, 'Personalized handmade shirt');
  });

  it('leaves unmapped headers unchanged', async () => {
    const sheets = makeSheets([
      ['Product ID', 'Business Area', 'Custom Column'],
      ['P-1', 'Sewing', 'kept as-is'],
    ]);

    const result = await readSheet('products', sheets as never, 'spreadsheet-id', warnings);

    assert.strictEqual(result.records[0].values['Custom Column'], 'kept as-is');
  });
});

describe('readSheet — collection header mapping', () => {
  it('maps Description and Short Description for collections', async () => {
    const sheets = makeSheets([
      ['Collection ID', 'Business Area', 'Collection Name', 'Short Description', 'Description'],
      ['C-1', 'Bakery', 'Breads', 'Slow-risen loaves', 'Each bake is made in small batches.'],
    ]);

    const result = await readSheet('collections', sheets as never, 'spreadsheet-id', warnings);

    assert.strictEqual(result.records[0].values.shortDescription, 'Slow-risen loaves');
    assert.strictEqual(result.records[0].values.description, 'Each bake is made in small batches.');
  });
});

describe('description pipeline — sheets to generated JSON', () => {
  it('retains the description through readSheet, normalization, and generated JSON', async () => {
    const sheets = makeSheets([
      ['Product ID', 'Business Area', 'Product Name', 'Short Description', 'Description', 'Collection', 'Form ID'],
      ['SW-CS-001', 'Sewing', 'Custom Design Shirt', 'Personalized handmade shirt', 'Shirt customized with customer-selected theme and design', 'Custom Shirts', 'SW-SHIRT'],
    ]);

    const readResult = await readSheet('products', sheets as never, 'spreadsheet-id', warnings);
    assert.strictEqual(readResult.found, true);

    const normalized = normalizeProducts(readResult.records);
    assert.strictEqual(normalized[0].description, 'Shirt customized with customer-selected theme and design');
    assert.strictEqual(normalized[0].shortDescription, 'Personalized handmade shirt');

    const generated = createGeneratedJson(normalized);
    const roundTrip = JSON.parse(JSON.stringify(generated)) as { data: Array<{ description: string; shortDescription: string }> };
    assert.strictEqual(roundTrip.data[0].description, 'Shirt customized with customer-selected theme and design');
    assert.strictEqual(roundTrip.data[0].shortDescription, 'Personalized handmade shirt');
  });

  it('keeps Short Description mapping unchanged while Description flows through', async () => {
    const sheets = makeSheets([
      ['Product ID', 'Business Area', 'Product Name', 'Short Description', 'Description', 'Collection'],
      ['BK-CH-001', 'Bakery', 'Challah Bread', '', 'A hand-braided loaf made fresh for Shabbat.', 'Challah Bread'],
    ]);

    const readResult = await readSheet('products', sheets as never, 'spreadsheet-id', warnings);
    const normalized = normalizeProducts(readResult.records);

    assert.strictEqual(normalized[0].shortDescription, '');
    assert.strictEqual(normalized[0].description, 'A hand-braided loaf made fresh for Shabbat.');
  });
});
