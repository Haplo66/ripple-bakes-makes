/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { CsvRecord, PipelineWarning } from '../../scripts/pipeline/types.ts';
import { validateRecords } from '../../scripts/pipeline/validators.ts';

const makeRecord = (rowNumber: number, values: Record<string, string>): CsvRecord => ({
  rowNumber,
  values,
});

describe('validateRecords — products', () => {
  it('passes records with all required fields', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'prod-1', businessArea: 'bakery', collection: 'cakes', name: 'Cake' }),
      makeRecord(3, { id: 'prod-2', businessArea: 'sewing', collection: 'shirts', name: 'Shirt' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('products', 'products.csv', records, warnings);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(warnings.length, 0);
  });

  it('filters records missing id', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: '', businessArea: 'bakery', collection: 'cakes', name: 'Cake' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('products', 'products.csv', records, warnings);
    assert.strictEqual(result.length, 0);
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0].column, 'id');
    assert.strictEqual(warnings[0].rowNumber, 2);
  });

  it('filters records missing businessArea', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'prod-1', businessArea: '', collection: 'cakes', name: 'Cake' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('products', 'products.csv', records, warnings);
    assert.strictEqual(result.length, 0);
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0].column, 'businessArea');
  });

  it('filters records missing collection', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'prod-1', businessArea: 'bakery', collection: '', name: 'Cake' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('products', 'products.csv', records, warnings);
    assert.strictEqual(result.length, 0);
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0].column, 'collection');
  });

  it('filters records missing name', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'prod-1', businessArea: 'bakery', collection: 'cakes', name: '' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('products', 'products.csv', records, warnings);
    assert.strictEqual(result.length, 0);
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0].column, 'name');
  });

  it('emits one warning per missing field per record', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: '', businessArea: '', collection: '', name: '' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('products', 'products.csv', records, warnings);
    assert.strictEqual(result.length, 0);
    assert.strictEqual(warnings.length, 4);
  });

  it('mixed valid and invalid records', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'valid', businessArea: 'bakery', collection: 'cakes', name: 'Cake' }),
      makeRecord(3, { id: '', businessArea: 'bakery', collection: 'cakes', name: 'Cake' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('products', 'products.csv', records, warnings);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].values.id, 'valid');
    assert.strictEqual(warnings.length, 1);
  });
});

describe('validateRecords — collections', () => {
  it('passes records with all required fields', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'coll-1', businessArea: 'bakery', name: 'Cakes' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('collections', 'collections.csv', records, warnings);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(warnings.length, 0);
  });

  it('filters records missing id', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: '', businessArea: 'bakery', name: 'Cakes' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('collections', 'collections.csv', records, warnings);
    assert.strictEqual(result.length, 0);
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0].column, 'id');
  });

  it('filters records missing businessArea', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'coll-1', businessArea: '', name: 'Cakes' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('collections', 'collections.csv', records, warnings);
    assert.strictEqual(result.length, 0);
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0].column, 'businessArea');
  });

  it('filters records missing name', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'coll-1', businessArea: 'bakery', name: '' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('collections', 'collections.csv', records, warnings);
    assert.strictEqual(result.length, 0);
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0].column, 'name');
  });
});

describe('validateRecords — forms', () => {
  it('requires formId, fieldName, fieldType for row-per-field format', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { formId: 'form-1', fieldName: 'size', fieldType: 'dropdown' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('forms', 'forms.csv', records, warnings);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(warnings.length, 0);
  });

  it('filters row-per-field records missing formId', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { formId: '', fieldName: 'size', fieldType: 'dropdown' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('forms', 'forms.csv', records, warnings);
    assert.strictEqual(result.length, 0);
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0].column, 'formId');
  });

  it('filters row-per-field records missing fieldName', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { formId: 'form-1', fieldName: '', fieldType: 'dropdown' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('forms', 'forms.csv', records, warnings);
    assert.strictEqual(result.length, 0);
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0].column, 'fieldName');
  });

  it('filters row-per-field records missing fieldType', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { formId: 'form-1', fieldName: 'size', fieldType: '' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('forms', 'forms.csv', records, warnings);
    assert.strictEqual(result.length, 0);
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0].column, 'fieldType');
  });

  it('requires id and name for JSON fields format', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'form-1', name: 'My Form', fields: '[]' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('forms', 'forms.csv', records, warnings);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(warnings.length, 0);
  });

  it('filters JSON format records missing id', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: '', name: 'My Form', fields: '[]' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('forms', 'forms.csv', records, warnings);
    assert.strictEqual(result.length, 0);
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0].column, 'id');
  });

  it('filters JSON format records missing name', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'form-1', name: '', fields: '[]' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('forms', 'forms.csv', records, warnings);
    assert.strictEqual(result.length, 0);
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0].column, 'name');
  });

  it('returns all records when format is unrecognized', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { unknown1: 'a', unknown2: 'b' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = validateRecords('forms', 'forms.csv', records, warnings);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(warnings.length, 0);
  });
});

describe('validateRecords — warning structure', () => {
  it('includes file, rowNumber, column, and reason', () => {
    const records: CsvRecord[] = [
      makeRecord(5, { id: '', businessArea: 'bakery', collection: 'cakes', name: 'Cake' }),
    ];
    const warnings: PipelineWarning[] = [];
    validateRecords('products', 'products.csv', records, warnings);
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0].file, 'products.csv');
    assert.strictEqual(warnings[0].rowNumber, 5);
    assert.strictEqual(warnings[0].column, 'id');
    assert.strictEqual(warnings[0].reason, 'Required field is missing.');
  });
});
