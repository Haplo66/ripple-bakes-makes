/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  classifyProductFolders,
  findStaleManifestProducts,
  type CatalogProduct,
  type FolderCandidate,
  type ManifestProductEntry,
} from '../../scripts/pipeline/product-folder-classifier.ts';

const CATALOG: CatalogProduct[] = [
  { id: 'SW-ST-001', name: 'Snake' },
  { id: 'SW-ST-002', name: 'Dog' },
  { id: 'SW-ST-003', name: 'Animal Lovie' },
  { id: 'BK-CH-001', name: 'Challah Bread' },
];

const MANIFEST: ManifestProductEntry[] = [
  { code: 'SW-ST-001', folder: 'Soft Toy', files: [] },
  { code: 'BK-CH-001', folder: 'Challah Bread', files: [] },
  { code: 'BK-GB-001', folder: 'Garlic Buns', files: [] },
];

const makeCandidate = (name: string, fullPath: string, id: string = name): FolderCandidate => ({
  id,
  name,
  fullPath,
});

describe('classifyProductFolders', () => {
  it('classifies a folder matching a current product name as a product', () => {
    const verdicts = classifyProductFolders(
      [makeCandidate('Snake', 'Sewing/Soft Toys/Snake')],
      CATALOG,
      MANIFEST,
    );
    assert.strictEqual(verdicts.length, 1);
    assert.strictEqual(verdicts[0].kind, 'product');
    if (verdicts[0].kind !== 'product') return;
    assert.strictEqual(verdicts[0].product.id, 'SW-ST-001');
    assert.strictEqual(verdicts[0].matchedBy, 'name');
  });

  it('classifies a folder named by product id as a product', () => {
    const verdicts = classifyProductFolders(
      [makeCandidate('BK-CH-001', 'Bakery/Challah Bread/Challah Bread')],
      CATALOG,
      MANIFEST,
    );
    assert.strictEqual(verdicts.length, 1);
    assert.strictEqual(verdicts[0].kind, 'product');
    if (verdicts[0].kind !== 'product') return;
    assert.strictEqual(verdicts[0].matchedBy, 'id');
  });

  it('marks a folder with no matching product as unmatched', () => {
    const verdicts = classifyProductFolders(
      [makeCandidate('Unicorns', 'Sewing/Soft Toys/Unicorns')],
      CATALOG,
      MANIFEST,
    );
    assert.strictEqual(verdicts.length, 1);
    assert.strictEqual(verdicts[0].kind, 'unmatched');
  });

  it('does not rely on the manifest to discover a new product folder', () => {
    const newFolder = makeCandidate('Animal Lovie', 'Sewing/Soft Toys/Animal Lovie');
    const noManifest: ManifestProductEntry[] = [];
    const verdicts = classifyProductFolders([newFolder], CATALOG, noManifest);
    assert.strictEqual(verdicts.length, 1);
    assert.strictEqual(verdicts[0].kind, 'product');
    if (verdicts[0].kind !== 'product') return;
    assert.strictEqual(verdicts[0].manifestEntry, undefined);
  });

  it('attaches the manifest entry as a checksum cache when it matches', () => {
    const verdicts = classifyProductFolders(
      [makeCandidate('Challah Bread', 'Bakery/Challah Bread/Challah Bread')],
      CATALOG,
      MANIFEST,
    );
    assert.strictEqual(verdicts[0].kind, 'product');
    if (verdicts[0].kind !== 'product') return;
    assert.ok(verdicts[0].manifestEntry);
    assert.strictEqual(verdicts[0].manifestEntry!.code, 'BK-CH-001');
  });

  it('deduplicates folders that resolve to the same target path', () => {
    const verdicts = classifyProductFolders(
      [
        makeCandidate('Snake', 'Sewing/Soft Toys/Snake'),
        makeCandidate('Snake', 'Sewing/Soft Toys/Snake', 'other-id'),
      ],
      CATALOG,
      MANIFEST,
    );
    assert.strictEqual(verdicts.length, 1);
  });

  it('classifies every matching product folder independently', () => {
    const verdicts = classifyProductFolders(
      [
        makeCandidate('Snake', 'Sewing/Soft Toys/Snake'),
        makeCandidate('Dog', 'Sewing/Soft Toys/Dog'),
        makeCandidate('Animal Lovie', 'Sewing/Soft Toys/Animal Lovie'),
        makeCandidate('Unicorns', 'Sewing/Soft Toys/Unicorns'),
      ],
      CATALOG,
      MANIFEST,
    );
    const products = verdicts.filter((v) => v.kind === 'product');
    const unmatched = verdicts.filter((v) => v.kind === 'unmatched');
    assert.strictEqual(products.length, 3);
    assert.strictEqual(unmatched.length, 1);
  });

  it('resolves a renamed product folder through the manifest Product ID link', () => {
    const verdicts = classifyProductFolders(
      [makeCandidate('Soft Toy', 'Sewing/Soft Toys/Soft Toy')],
      CATALOG,
      MANIFEST,
    );
    assert.strictEqual(verdicts.length, 1);
    assert.strictEqual(verdicts[0].kind, 'product');
    if (verdicts[0].kind !== 'product') return;
    assert.strictEqual(verdicts[0].product.id, 'SW-ST-001');
    assert.strictEqual(verdicts[0].product.name, 'Snake');
    assert.strictEqual(verdicts[0].matchedBy, 'manifest-folder');
    assert.strictEqual(verdicts[0].manifestEntry!.code, 'SW-ST-001');
  });

  it('matches a tolerant name change via normalized name matching', () => {
    const verdicts = classifyProductFolders(
      [
        makeCandidate('Bucket Hat', 'Sewing/Bucket Hats/Bucket Hat'),
        makeCandidate('Beanie Hat', 'Sewing/Beanie Hats/Beanie Hat'),
        makeCandidate('Bucket Hats', 'Sewing/Bucket Hats/Bucket Hats', 'second-id'),
      ],
      [
        ...CATALOG,
        { id: 'SW-HS-001', name: 'Bucket Hats' },
        { id: 'SW-HW-001', name: 'Beanie Hats' },
      ],
      MANIFEST,
    );
    assert.strictEqual(verdicts.length, 3);
    const bucket = verdicts.find((v) => v.kind === 'product' && v.candidate.fullPath === 'Sewing/Bucket Hats/Bucket Hat');
    assert.ok(bucket);
    if (!bucket || bucket.kind !== 'product') return;
    assert.strictEqual(bucket.product.id, 'SW-HS-001');
    assert.strictEqual(bucket.matchedBy, 'normalized');
    const beanie = verdicts.find((v) => v.kind === 'product' && v.candidate.fullPath === 'Sewing/Beanie Hats/Beanie Hat');
    assert.ok(beanie);
    if (!beanie || beanie.kind !== 'product') return;
    assert.strictEqual(beanie.product.id, 'SW-HW-001');
    assert.strictEqual(beanie.matchedBy, 'normalized');
  });
});

describe('findStaleManifestProducts', () => {
  it('flags manifest entries whose product no longer exists in the catalog', () => {
    const stale = findStaleManifestProducts(MANIFEST, CATALOG);
    const entry = stale.find((s) => s.code === 'BK-GB-001');
    assert.ok(entry);
    assert.match(entry!.reason, /no longer exists/);
  });

  it('does not flag a renamed product whose Product ID is unchanged', () => {
    const stale = findStaleManifestProducts(MANIFEST, CATALOG);
    const entry = stale.find((s) => s.code === 'SW-ST-001');
    assert.ok(!entry, 'SW-ST-001 exists in the catalog, so its manifest entry must not be stale');
  });

  it('does not flag an unchanged product whose name still matches', () => {
    const stale = findStaleManifestProducts(MANIFEST, CATALOG);
    assert.ok(!stale.some((s) => s.code === 'BK-CH-001'));
  });

  it('reports no stale entries when everything matches', () => {
    const aligned: ManifestProductEntry[] = [
      { code: 'SW-ST-001', folder: 'Snake', files: [] },
      { code: 'BK-CH-001', folder: 'Challah Bread', files: [] },
    ];
    assert.strictEqual(findStaleManifestProducts(aligned, CATALOG).length, 0);
  });
});
