/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { normalizeId, parseBoolean, parseNumber, parseNullableString, parsePipeField } from '../../scripts/pipeline/normalizers.ts';
import { normalizeProducts, normalizeCollections, normalizeForms } from '../../scripts/pipeline/normalizers.ts';
import type { CsvRecord, PipelineWarning } from '../../scripts/pipeline/types.ts';

const makeRecord = (rowNumber: number, values: Record<string, string>): CsvRecord => ({ rowNumber, values });

describe('normalizeId', () => {
  it('lowercases the input', () => {
    assert.strictEqual(normalizeId('HELLO'), 'hello');
    assert.strictEqual(normalizeId('MixedCase'), 'mixedcase');
  });

  it('replaces spaces with hyphens', () => {
    assert.strictEqual(normalizeId('hello world'), 'hello-world');
    assert.strictEqual(normalizeId('  spaced  '), 'spaced');
  });

  it('replaces underscores with hyphens', () => {
    assert.strictEqual(normalizeId('hello_world'), 'hello-world');
  });

  it('removes non-alphanumeric characters except hyphens', () => {
    assert.strictEqual(normalizeId('hello@world!'), 'helloworld');
    assert.strictEqual(normalizeId('price: $10'), 'price-10');
  });

  it('collapses duplicate hyphens', () => {
    assert.strictEqual(normalizeId('hello---world'), 'hello-world');
    assert.strictEqual(normalizeId('a__b__c'), 'a-b-c');
  });

  it('strips leading and trailing hyphens', () => {
    assert.strictEqual(normalizeId('-hello-'), 'hello');
    assert.strictEqual(normalizeId('--hello--'), 'hello');
  });

  it('handles empty string', () => {
    assert.strictEqual(normalizeId(''), '');
  });

  it('handles strings with only special characters', () => {
    assert.strictEqual(normalizeId('@#$%'), '');
  });
});

describe('parseBoolean', () => {
  it('returns true for "true"', () => {
    assert.strictEqual(parseBoolean('true'), true);
  });

  it('returns true for "yes"', () => {
    assert.strictEqual(parseBoolean('yes'), true);
  });

  it('returns true for "1"', () => {
    assert.strictEqual(parseBoolean('1'), true);
  });

  it('returns true for "active"', () => {
    assert.strictEqual(parseBoolean('active'), true);
  });

  it('returns false for "false"', () => {
    assert.strictEqual(parseBoolean('false'), false);
  });

  it('returns false for "no"', () => {
    assert.strictEqual(parseBoolean('no'), false);
  });

  it('returns false for "0"', () => {
    assert.strictEqual(parseBoolean('0'), false);
  });

  it('returns false for empty string', () => {
    assert.strictEqual(parseBoolean(''), false);
  });

  it('returns fallback when value is empty', () => {
    assert.strictEqual(parseBoolean('', true), true);
  });

  it('is case insensitive', () => {
    assert.strictEqual(parseBoolean('TRUE'), true);
    assert.strictEqual(parseBoolean('Yes'), true);
    assert.strictEqual(parseBoolean('ACTIVE'), true);
  });
});

describe('parseNumber', () => {
  it('parses integer strings', () => {
    assert.strictEqual(parseNumber('42'), 42);
  });

  it('parses decimal strings', () => {
    assert.strictEqual(parseNumber('3.14'), 3.14);
  });

  it('parses negative numbers', () => {
    assert.strictEqual(parseNumber('-5'), -5);
  });

  it('returns 0 for non-numeric strings', () => {
    assert.strictEqual(parseNumber('abc'), 0);
  });

  it('returns 0 for empty string', () => {
    assert.strictEqual(parseNumber(''), 0);
  });

  it('returns fallback when value is not finite', () => {
    assert.strictEqual(parseNumber('Infinity'), 0);
    assert.strictEqual(parseNumber('NaN'), 0);
  });

  it('trims whitespace before parsing', () => {
    assert.strictEqual(parseNumber('  42  '), 42);
  });
});

describe('parseNullableString', () => {
  it('returns trimmed value for non-empty string', () => {
    assert.strictEqual(parseNullableString('hello'), 'hello');
  });

  it('trims whitespace', () => {
    assert.strictEqual(parseNullableString('  hello  '), 'hello');
  });

  it('returns null for empty string', () => {
    assert.strictEqual(parseNullableString(''), null);
  });

  it('returns null for whitespace-only string', () => {
    assert.strictEqual(parseNullableString('   '), null);
  });
});

describe('parsePipeField', () => {
  it('splits pipe-delimited string into array', () => {
    assert.deepStrictEqual(parsePipeField('a|b|c'), ['a', 'b', 'c']);
  });

  it('trims whitespace around each value', () => {
    assert.deepStrictEqual(parsePipeField(' a | b | c '), ['a', 'b', 'c']);
  });

  it('filters out empty segments', () => {
    assert.deepStrictEqual(parsePipeField('a||b|'), ['a', 'b']);
  });

  it('returns empty array for empty string', () => {
    assert.deepStrictEqual(parsePipeField(''), []);
  });

  it('returns empty array for whitespace-only string', () => {
    assert.deepStrictEqual(parsePipeField('   '), []);
  });
});

describe('normalizeProducts', () => {
  it('lowercases businessArea', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'Bakery', collection: 'cakes', name: 'Cake' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].businessArea, 'bakery');
  });

  it('slugifies collection', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'Cakes & Pastries', name: 'Cake' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].collection, 'cakes-pastries');
  });

  it('defaults slug to slugified name when slug is empty', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Vanilla Cake', slug: '' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].slug, 'vanilla-cake');
  });

  it('uses slug when provided', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Vanilla Cake', slug: 'my-custom-slug' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].slug, 'my-custom-slug');
  });

  it('defaults status to Active', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', status: '' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].status, 'Active');
  });

  it('uses provided status', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', status: 'Seasonal' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].status, 'Seasonal');
  });

  it('defaults featured to false', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', featured: '' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].featured, false);
  });

  it('defaults homepageFeatured to false', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', homepageFeatured: '' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].homepageFeatured, false);
  });

  it('defaults galleryFeatured to true', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', galleryFeatured: '' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].galleryFeatured, true);
  });

  it('defaults imageTone to cream', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', imageTone: '' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].imageTone, 'cream');
  });

  it('defaults active to true', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', active: '' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].active, true);
  });

  it('keeps active false when the active column is false', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', active: 'false' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].active, false);
  });

  it('preserves the status column for inactive statuses', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', status: 'Not Active' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].status, 'Not Active');
  });

  it('keeps active true for inactive statuses when the active column is true', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', status: 'Inactive', active: 'true' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].status, 'Inactive');
    assert.strictEqual(result[0].active, true);
  });

  it('keeps active driven by the active column, not status', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', status: 'Seasonal' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].active, true);
  });

  it('defaults displayOrder to 0', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', displayOrder: '' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].displayOrder, 0);
  });

  it('sets price to undefined when empty', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', price: '' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].price, undefined);
  });

  it('sets price to undefined when whitespace only', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', price: '   ' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].price, undefined);
  });

  it('parses price when provided', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', price: '45' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].price, 45);
  });

  it('parses images from pipe-delimited string', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', images: 'a.jpg|b.jpg|c.jpg' }),
    ];
    const result = normalizeProducts(records);
    assert.deepStrictEqual(result[0].images, ['a.jpg', 'b.jpg', 'c.jpg']);
  });

  it('sets image to null when empty', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', image: '' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].image, null);
  });

  it('sets image to trimmed value when provided', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake', image: 'main.jpg' }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].image, 'main.jpg');
  });

  it('passes through subtitle, shortDescription, description, category, formId, priceLabel', () => {
    const records: CsvRecord[] = [
      makeRecord(2, {
        id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake',
        subtitle: 'Best cake', shortDescription: 'Yummy', description: 'Long desc',
        category: 'dessert', formId: 'form-1', priceLabel: 'per slice',
      }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].subtitle, 'Best cake');
    assert.strictEqual(result[0].shortDescription, 'Yummy');
    assert.strictEqual(result[0].description, 'Long desc');
    assert.strictEqual(result[0].category, 'dessert');
    assert.strictEqual(result[0].formId, 'form-1');
    assert.strictEqual(result[0].priceLabel, 'per slice');
  });

  it('passes through availability, preparationTime, and fulfillment when provided', () => {
    const records: CsvRecord[] = [
      makeRecord(2, {
        id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake',
        availability: 'Made to Order', preparationTime: '2–3 Business Days',
        fulfillment: 'Pickup or Shipping',
      }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].availability, 'Made to Order');
    assert.strictEqual(result[0].preparationTime, '2–3 Business Days');
    assert.strictEqual(result[0].fulfillment, 'Pickup or Shipping');
  });

  it('sets availability, preparationTime, and fulfillment to undefined when empty', () => {
    const records: CsvRecord[] = [
      makeRecord(2, {
        id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake',
        availability: '', preparationTime: '   ', fulfillment: '',
      }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].availability, undefined);
    assert.strictEqual(result[0].preparationTime, undefined);
    assert.strictEqual(result[0].fulfillment, undefined);
  });

  it('trims whitespace from availability, preparationTime, and fulfillment', () => {
    const records: CsvRecord[] = [
      makeRecord(2, {
        id: 'p1', businessArea: 'bakery', collection: 'cakes', name: 'Cake',
        availability: '  In Stock  ', preparationTime: ' 1–2 Business Days ',
        fulfillment: ' Pickup Only ',
      }),
    ];
    const result = normalizeProducts(records);
    assert.strictEqual(result[0].availability, 'In Stock');
    assert.strictEqual(result[0].preparationTime, '1–2 Business Days');
    assert.strictEqual(result[0].fulfillment, 'Pickup Only');
  });
});

describe('normalizeCollections', () => {
  it('normalizes id using normalizeId', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'My Collection!', businessArea: 'bakery', name: 'My Collection' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeCollections(records, 'collections.csv', warnings);
    assert.strictEqual(result[0].id, 'my-collection');
  });

  it('lowercases businessArea', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'c1', businessArea: 'Bakery', name: 'Cakes' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeCollections(records, 'collections.csv', warnings);
    assert.strictEqual(result[0].businessArea, 'bakery');
  });

  it('defaults slug to slugified name when slug is empty', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'c1', businessArea: 'bakery', name: 'Sourdough Breads', slug: '' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeCollections(records, 'collections.csv', warnings);
    assert.strictEqual(result[0].slug, 'sourdough-breads');
  });

  it('uses slug when provided', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'c1', businessArea: 'bakery', name: 'Sourdough Breads', slug: 'breads' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeCollections(records, 'collections.csv', warnings);
    assert.strictEqual(result[0].slug, 'breads');
  });

  it('defaults status to Active', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'c1', businessArea: 'bakery', name: 'Cakes', status: '' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeCollections(records, 'collections.csv', warnings);
    assert.strictEqual(result[0].status, 'Active');
  });

  it('defaults imageTone to cream', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'c1', businessArea: 'bakery', name: 'Cakes', imageTone: '' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeCollections(records, 'collections.csv', warnings);
    assert.strictEqual(result[0].imageTone, 'cream');
  });

  it('defaults displayOrder to 0', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'c1', businessArea: 'bakery', name: 'Cakes', displayOrder: '' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeCollections(records, 'collections.csv', warnings);
    assert.strictEqual(result[0].displayOrder, 0);
  });

  it('defaults featured to false', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'c1', businessArea: 'bakery', name: 'Cakes', featured: '' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeCollections(records, 'collections.csv', warnings);
    assert.strictEqual(result[0].featured, false);
  });

  it('parses images from pipe-delimited string', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'c1', businessArea: 'bakery', name: 'Cakes', images: 'hero.jpg|thumb.jpg' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeCollections(records, 'collections.csv', warnings);
    assert.deepStrictEqual(result[0].images, ['hero.jpg', 'thumb.jpg']);
  });

  it('parses heroImage as nullable string', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'c1', businessArea: 'bakery', name: 'Cakes', heroImage: '' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeCollections(records, 'collections.csv', warnings);
    assert.strictEqual(result[0].heroImage, null);
  });

  it('parses galleryCaptions as JSON array', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'c1', businessArea: 'bakery', name: 'Cakes', galleryCaptions: '["Yum","Tasty"]' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeCollections(records, 'collections.csv', warnings);
    assert.deepStrictEqual(result[0].galleryCaptions, ['Yum', 'Tasty']);
  });

  it('emits warning for invalid galleryCaptions JSON', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'c1', businessArea: 'bakery', name: 'Cakes', galleryCaptions: 'not-json' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeCollections(records, 'collections.csv', warnings);
    assert.deepStrictEqual(result[0].galleryCaptions, []);
    assert.strictEqual(warnings.length, 1);
    assert.strictEqual(warnings[0].column, 'galleryCaptions');
    assert.strictEqual(warnings[0].reason, 'Value must be valid JSON.');
  });

  it('parses popularIdeas as JSON array', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'c1', businessArea: 'bakery', name: 'Cakes', popularIdeas: '["Idea1"]' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeCollections(records, 'collections.csv', warnings);
    assert.deepStrictEqual(result[0].popularIdeas, ['Idea1']);
  });

  it('defaults customizationNote to empty string', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { id: 'c1', businessArea: 'bakery', name: 'Cakes' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeCollections(records, 'collections.csv', warnings);
    assert.strictEqual(result[0].customizationNote, '');
  });

  it('passes through subtitle, shortDescription, description, imageFolder', () => {
    const records: CsvRecord[] = [
      makeRecord(2, {
        id: 'c1', businessArea: 'bakery', name: 'Cakes',
        subtitle: 'Sub', shortDescription: 'Short', description: 'Long',
        imageFolder: 'products/bakery/cakes',
      }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeCollections(records, 'collections.csv', warnings);
    assert.strictEqual(result[0].subtitle, 'Sub');
    assert.strictEqual(result[0].shortDescription, 'Short');
    assert.strictEqual(result[0].description, 'Long');
    assert.strictEqual(result[0].imageFolder, 'products/bakery/cakes');
  });
});

describe('normalizeForms', () => {
  it('groups row-per-field format into forms', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { formId: 'form-1', formName: 'My Form', fieldName: 'Size', fieldType: 'dropdown', values: 'S|M|L', required: 'true' }),
      makeRecord(3, { formId: 'form-1', formName: 'My Form', fieldName: 'Color', fieldType: 'select', values: 'Red|Blue', required: 'false' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeForms(records, 'forms.csv', warnings);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'form-1');
    assert.strictEqual(result[0].name, 'My Form');
    assert.strictEqual(result[0].fields.length, 2);
    assert.strictEqual(result[0].fields[0].id, 'size');
    assert.strictEqual(result[0].fields[0].label, 'Size');
    assert.strictEqual(result[0].fields[0].type, 'select');
    assert.strictEqual(result[0].fields[0].required, true);
    assert.deepStrictEqual(result[0].fields[0].options, [
      { value: 's', label: 'S' },
      { value: 'm', label: 'M' },
      { value: 'l', label: 'L' },
    ]);
  });

  it('skips rows without formId or fieldName', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { formId: '', formName: '', fieldName: '', fieldType: '' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeForms(records, 'forms.csv', warnings);
    assert.strictEqual(result.length, 0);
  });

  it('parses JSON fields format', () => {
    const records: CsvRecord[] = [
      makeRecord(2, {
        id: 'form-1', name: 'My Form',
        fields: '[{"id":"size","label":"Size","type":"select","required":true,"options":[{"value":"s","label":"S"}]}]',
      }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeForms(records, 'forms.csv', warnings);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'form-1');
    assert.strictEqual(result[0].name, 'My Form');
    assert.strictEqual(result[0].fields.length, 1);
    assert.strictEqual(result[0].fields[0].id, 'size');
  });

  it('maps field types correctly', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { formId: 'f1', formName: 'F', fieldName: 'F1', fieldType: 'dropdown', required: 'false' }),
      makeRecord(3, { formId: 'f1', formName: 'F', fieldName: 'F2', fieldType: 'textbox', required: 'false' }),
      makeRecord(4, { formId: 'f1', formName: 'F', fieldName: 'F3', fieldType: 'unknown', required: 'false' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeForms(records, 'forms.csv', warnings);
    assert.strictEqual(result[0].fields[0].type, 'select');
    assert.strictEqual(result[0].fields[1].type, 'text');
    assert.strictEqual(result[0].fields[2].type, 'text');
  });

  it('handles empty records', () => {
    const records: CsvRecord[] = [];
    const warnings: PipelineWarning[] = [];
    const result = normalizeForms(records, 'forms.csv', warnings);
    assert.deepStrictEqual(result, []);
  });

  it('emits warning for unrecognized format', () => {
    const records: CsvRecord[] = [
      makeRecord(2, { unknown: 'value' }),
    ];
    const warnings: PipelineWarning[] = [];
    const result = normalizeForms(records, 'forms.csv', warnings);
    assert.deepStrictEqual(result, []);
    assert.strictEqual(warnings.length, 1);
    assert.ok(warnings[0].reason.includes('not recognized'));
  });
});
