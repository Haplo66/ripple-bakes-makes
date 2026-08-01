/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { HEADER_MAP, normalizeHeader } from '../../scripts/pipeline/sheets-reader.ts';

describe('normalizeHeader', () => {
  it('maps Availability to availability for products', () => {
    assert.strictEqual(normalizeHeader('Availability', 'products'), 'availability');
  });

  it('maps Preparation Time to preparationTime for products', () => {
    assert.strictEqual(normalizeHeader('Preparation Time', 'products'), 'preparationTime');
  });

  it('maps Fulfillment to fulfillment for products', () => {
    assert.strictEqual(normalizeHeader('Fulfillment', 'products'), 'fulfillment');
  });

  it('maps Status to status for products', () => {
    assert.strictEqual(normalizeHeader('Status', 'products'), 'status');
  });

  it('maps existing human-readable product headers', () => {
    assert.strictEqual(normalizeHeader('Product ID', 'products'), 'id');
    assert.strictEqual(normalizeHeader('Business Area', 'products'), 'businessArea');
    assert.strictEqual(normalizeHeader('Product Name', 'products'), 'name');
    assert.strictEqual(normalizeHeader('Short Description', 'products'), 'shortDescription');
    assert.strictEqual(normalizeHeader('Form ID', 'products'), 'formId');
    assert.strictEqual(normalizeHeader('Homepage Featured', 'products'), 'homepageFeatured');
    assert.strictEqual(normalizeHeader('Gallery Featured', 'products'), 'galleryFeatured');
  });

  it('passes through unmapped headers unchanged', () => {
    assert.strictEqual(normalizeHeader('status', 'products'), 'status');
    assert.strictEqual(normalizeHeader('slug', 'products'), 'slug');
    assert.strictEqual(normalizeHeader('Unrelated Column', 'products'), 'Unrelated Column');
  });

  it('maps headers for collections and forms datasets', () => {
    assert.strictEqual(normalizeHeader('Collection ID', 'collections'), 'id');
    assert.strictEqual(normalizeHeader('Collection Name', 'collections'), 'name');
    assert.strictEqual(normalizeHeader('Collection Code', 'collections'), 'code');
    assert.strictEqual(normalizeHeader('Field Name', 'forms'), 'fieldName');
    assert.strictEqual(normalizeHeader('Field Type', 'forms'), 'fieldType');
  });

  it('includes the new fulfillment columns in the products header map', () => {
    assert.ok('Availability' in HEADER_MAP.products);
    assert.ok('Preparation Time' in HEADER_MAP.products);
    assert.ok('Fulfillment' in HEADER_MAP.products);
    assert.ok('Status' in HEADER_MAP.products);
  });
});
