/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { CsvRecord, PipelineWarning } from '../../scripts/pipeline/types.ts';
import {
  assignProductIds,
  BUSINESS_AREA_CODES,
  PRODUCT_ID_PATTERN,
} from '../../scripts/pipeline/product-ids.ts';

const makeRecord = (rowNumber: number, values: Record<string, string>): CsvRecord => ({ rowNumber, values });

const SEWING = { id: 'soft-toys', code: 'ST' };
const BAKERY = { id: 'challah-bread', code: 'CH' };

describe('BUSINESS_AREA_CODES', () => {
  it('maps bakery and sewing to BK and SW', () => {
    assert.strictEqual(BUSINESS_AREA_CODES.bakery, 'BK');
    assert.strictEqual(BUSINESS_AREA_CODES.sewing, 'SW');
  });
});

describe('PRODUCT_ID_PATTERN', () => {
  it('matches the canonical ID shape', () => {
    assert.ok(PRODUCT_ID_PATTERN.test('SW-ST-001'));
    assert.ok(PRODUCT_ID_PATTERN.test('BK-CH-123'));
  });

  it('rejects malformed IDs', () => {
    assert.ok(!PRODUCT_ID_PATTERN.test('SW-ST-1'));
    assert.ok(!PRODUCT_ID_PATTERN.test('SW-ST-0010'));
    assert.ok(!PRODUCT_ID_PATTERN.test('sw-st-001'));
    assert.ok(!PRODUCT_ID_PATTERN.test('SWST001'));
  });
});

describe('assignProductIds', () => {
  it('generates the next available ID for a blank Product ID', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'SW-ST-001', businessArea: 'sewing', collection: 'soft-toys', name: 'Toy' }),
      makeRecord(3, { id: '', businessArea: 'sewing', collection: 'soft-toys', name: 'New Toy' }),
    ];
    const warnings: PipelineWarning[] = [];
    const { generated } = assignProductIds(records, [SEWING], 'products.csv', warnings);
    assert.strictEqual(records[1].values.id, 'SW-ST-002');
    assert.strictEqual(generated.length, 1);
    assert.strictEqual(generated[0].id, 'SW-ST-002');
    assert.strictEqual(generated[0].rowNumber, 3);
    assert.strictEqual(warnings.length, 0);
  });

  it('never reuses an existing Product ID', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'SW-ST-002', businessArea: 'sewing', collection: 'soft-toys', name: 'Toy' }),
      makeRecord(3, { id: '', businessArea: 'sewing', collection: 'soft-toys', name: 'New Toy' }),
    ];
    const warnings: PipelineWarning[] = [];
    assignProductIds(records, [SEWING], 'products.csv', warnings);
    assert.strictEqual(records[1].values.id, 'SW-ST-003');
  });

  it('generates sequential IDs for multiple blank rows in one pass', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: '', businessArea: 'sewing', collection: 'soft-toys', name: 'A' }),
      makeRecord(3, { id: '', businessArea: 'sewing', collection: 'soft-toys', name: 'B' }),
      makeRecord(4, { id: '', businessArea: 'sewing', collection: 'soft-toys', name: 'C' }),
    ];
    const warnings: PipelineWarning[] = [];
    assignProductIds(records, [SEWING], 'products.csv', warnings);
    assert.strictEqual(records[0].values.id, 'SW-ST-001');
    assert.strictEqual(records[1].values.id, 'SW-ST-002');
    assert.strictEqual(records[2].values.id, 'SW-ST-003');
  });

  it('leaves existing Product IDs untouched', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'SW-ST-007', businessArea: 'sewing', collection: 'soft-toys', name: 'Existing' }),
    ];
    const warnings: PipelineWarning[] = [];
    assignProductIds(records, [SEWING], 'products.csv', warnings);
    assert.strictEqual(records[0].values.id, 'SW-ST-007');
    assert.strictEqual(warnings.length, 0);
  });

  it('uses the business area prefix in the generated ID', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: '', businessArea: 'bakery', collection: 'challah-bread', name: 'Bread' }),
    ];
    const warnings: PipelineWarning[] = [];
    assignProductIds(records, [BAKERY], 'products.csv', warnings);
    assert.strictEqual(records[0].values.id, 'BK-CH-001');
  });

  it('derives the collection code from an existing product ID when the collection has no code', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'SW-ST-001', businessArea: 'sewing', collection: 'soft-toys', name: 'Toy' }),
      makeRecord(3, { id: '', businessArea: 'sewing', collection: 'soft-toys', name: 'New Toy' }),
    ];
    const warnings: PipelineWarning[] = [];
    assignProductIds(records, [{ id: 'soft-toys', code: '' }], 'products.csv', warnings);
    assert.strictEqual(records[1].values.id, 'SW-ST-002');
    assert.strictEqual(warnings.length, 0);
  });

  it('warns and leaves the ID blank when no collection code can be determined', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: '', businessArea: 'sewing', collection: 'brand-new-collection', name: 'New' }),
    ];
    const warnings: PipelineWarning[] = [];
    assignProductIds(records, [], 'products.csv', warnings);
    assert.strictEqual(records[0].values.id, '');
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0].column, 'id');
  });

  it('warns for an unknown business area', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: '', businessArea: 'gardening', collection: 'soft-toys', name: 'New' }),
    ];
    const warnings: PipelineWarning[] = [];
    assignProductIds(records, [SEWING], 'products.csv', warnings);
    assert.strictEqual(records[0].values.id, '');
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0].column, 'businessArea');
  });

  it('matches collection codes case-insensitively from sheet input', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: '', businessArea: 'sewing', collection: 'Soft Toys', name: 'Toy' }),
    ];
    const warnings: PipelineWarning[] = [];
    assignProductIds(records, [{ id: 'soft-toys', code: 'st' }], 'products.csv', warnings);
    assert.strictEqual(records[0].values.id, 'SW-ST-001');
  });

  it('reuses an existing ID when the exact product is in prior state', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: '', businessArea: 'sewing', collection: 'soft-toys', name: 'Toy' }),
    ];
    const prior = [{ id: 'SW-ST-001', businessArea: 'sewing', collection: 'soft-toys', name: 'Toy' }];
    const warnings: PipelineWarning[] = [];
    const { generated } = assignProductIds(records, [SEWING], 'products.csv', warnings, prior);
    assert.strictEqual(records[0].values.id, 'SW-ST-001');
    assert.strictEqual(generated.length, 1);
    assert.strictEqual(warnings.length, 0);
  });

  it('carries over an ID for a single rename inside the same collection', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: '', businessArea: 'bakery', collection: 'sourdough-bread', name: 'Mix-Ins Sourdough Loaf' }),
    ];
    const prior = [
      {
        id: 'BK-SB-002',
        businessArea: 'bakery',
        collection: 'sourdough-bread',
        name: 'Seeded Sourdough Loaf',
      },
    ];
    const warnings: PipelineWarning[] = [];
    const { generated } = assignProductIds(
      records,
      [{ id: 'sourdough-bread', code: 'SB' }],
      'products.csv',
      warnings,
      prior,
    );
    assert.strictEqual(records[0].values.id, 'BK-SB-002');
    assert.strictEqual(generated.length, 1);
    assert.strictEqual(warnings.length, 0);
  });

  it('does not carry over an ID when two products swap names in a collection', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: '', businessArea: 'bakery', collection: 'sourdough-bread', name: 'Original Loaf' }),
      makeRecord(3, { id: '', businessArea: 'bakery', collection: 'sourdough-bread', name: 'New Loaf' }),
    ];
    const prior = [
      {
        id: 'BK-SB-001',
        businessArea: 'bakery',
        collection: 'sourdough-bread',
        name: 'Original Loaf',
      },
      {
        id: 'BK-SB-002',
        businessArea: 'bakery',
        collection: 'sourdough-bread',
        name: 'Seeded Sourdough Loaf',
      },
    ];
    const warnings: PipelineWarning[] = [];
    assignProductIds(
      records,
      [{ id: 'sourdough-bread', code: 'SB' }],
      'products.csv',
      warnings,
      prior,
    );

    const assigned = new Set(records.map((r) => r.values.id));
    assert.strictEqual(
      assigned.has('BK-SB-001') && assigned.has('BK-SB-002'),
      true,
    );
    assert.strictEqual(warnings.length, 0);
  });

  it('avoids re-issuing an ID already present in prior state', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: '', businessArea: 'sewing', collection: 'soft-toys', name: 'Brand New Toy' }),
    ];
    const prior = [
      { id: 'SW-ST-001', businessArea: 'sewing', collection: 'soft-toys', name: 'Toy' },
      { id: 'SW-ST-002', businessArea: 'sewing', collection: 'soft-toys', name: 'Another Toy' },
    ];
    const warnings: PipelineWarning[] = [];
    const { generated } = assignProductIds(records, [SEWING], 'products.csv', warnings, prior);
    assert.strictEqual(records[0].values.id, 'SW-ST-003');
    assert.strictEqual(generated[0].id, 'SW-ST-003');
    assert.strictEqual(warnings.length, 0);
  });
});
