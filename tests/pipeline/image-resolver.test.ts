/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveProductImages } from '../../scripts/pipeline/image-resolver.ts';
import type { PipelineWarning } from '../../scripts/pipeline/types.ts';

let tempDir: string | undefined;

const touch = (...segments: string[]): string => {
  const path = join(tempDir!, ...segments);
  mkdirSync(path, { recursive: true });
  writeFileSync(join(path, 'main.jpg'), 'x');
  return path;
};

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

const resolve = (
  options: {
    productId: string;
    collectionId?: string;
    businessArea?: string;
    productName?: string;
    collectionName?: string;
    areaName?: string;
    manifestFolder?: string;
  },
): { images: string[]; imageFolder: string } => {
  const warnings: PipelineWarning[] = [];
  const result = resolveProductImages(
    options.productId,
    options.collectionId ?? 'soft-toys',
    options.businessArea ?? 'sewing',
    warnings,
    { file: 'products.csv' },
    options.productName,
    options.collectionName,
    options.areaName,
    options.manifestFolder,
    tempDir!,
  );
  return { images: result.images, imageFolder: result.imageFolder };
};

describe('resolveProductImages', () => {
  it('resolves a folder under products/{area}/{collection}/{product name}', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'ripple-resolve-'));
    touch('products', 'Sewing', 'Soft Toys', 'Soft Toy');
    const hit = resolve({
      productId: 'SW-ST-001',
      collectionId: 'soft-toys',
      businessArea: 'sewing',
      productName: 'Soft Toy',
      collectionName: 'Soft Toys',
      areaName: 'Sewing',
    });
    assert.strictEqual(hit.imageFolder, 'products/Sewing/Soft Toys/Soft Toy');
    assert.strictEqual(hit.images[0], 'main.jpg');
  });

  it('resolves via manifest folder when the product was renamed', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'ripple-resolve-'));
    touch('products', 'Bakery', 'Sourdough Bread', 'Seeded Sourdough Loaf');
    const hit = resolve({
      productId: 'BK-SB-002',
      collectionId: 'sourdough-bread',
      businessArea: 'bakery',
      productName: 'Mix-Ins Sourdough Loaf',
      collectionName: 'Sourdough Bread',
      areaName: 'Bakery',
      manifestFolder: 'Seeded Sourdough Loaf',
    });
    assert.strictEqual(hit.imageFolder, 'products/Bakery/Sourdough Bread/Seeded Sourdough Loaf');
    assert.strictEqual(hit.images[0], 'main.jpg');
  });

  it('resolves a singular/plural mismatched folder via normalized name', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'ripple-resolve-'));
    touch('products', 'Sewing', 'Bucket Hats', 'Bucket Hat');
    const hit = resolve({
      productId: 'SW-HS-001',
      collectionId: 'bucket-hats',
      businessArea: 'sewing',
      productName: 'Bucket Hats',
      collectionName: 'Bucket Hats',
      areaName: 'Sewing',
    });
    assert.strictEqual(hit.imageFolder, 'products/Sewing/Bucket Hats/Bucket Hat');
  });

  it('falls back to the collection folder when no product folder matches', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'ripple-resolve-'));
    touch('collections', 'Sewing', 'Bucket Hats');
    const hit = resolve({
      productId: 'SW-HS-001',
      collectionId: 'bucket-hats',
      businessArea: 'sewing',
      productName: 'Bucket Hats',
      collectionName: 'Bucket Hats',
      areaName: 'Sewing',
    });
    assert.strictEqual(hit.imageFolder, 'collections/Sewing/Bucket Hats');
  });

  it('returns empty when nothing matches', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'ripple-resolve-'));
    const hit = resolve({
      productId: 'SW-ST-001',
      collectionId: 'soft-toys',
      businessArea: 'sewing',
      productName: 'Toy',
      areaName: 'Sewing',
    });
    assert.deepStrictEqual(hit.images, []);
    assert.strictEqual(hit.imageFolder, '');
  });
});