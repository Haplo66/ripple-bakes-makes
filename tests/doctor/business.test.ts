/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  imageScore,
  analyzeProducts,
  computeMetrics,
  computeFormCoverage,
  calculateBusinessScore,
  generateRecommendations,
} from '../../scripts/doctor/business.ts';

describe('imageScore', () => {
  it('returns FAIL for 0 images', () => {
    assert.strictEqual(imageScore(0), 'FAIL');
  });

  it('returns WARN for 1 image', () => {
    assert.strictEqual(imageScore(1), 'WARN');
  });

  it('returns PASS for 2 or more images', () => {
    assert.strictEqual(imageScore(2), 'PASS');
    assert.strictEqual(imageScore(5), 'PASS');
    assert.strictEqual(imageScore(100), 'PASS');
  });
});

describe('analyzeProducts', () => {
  const defaultCollectionIds = new Set(['coll-1']);
  const defaultFormIds = new Set(['form-1']);

  it('filters out inactive products', () => {
    const products = [
      { id: 'p1', name: 'Active', active: true, businessArea: 'bakery', collection: 'coll-1' },
      { id: 'p2', name: 'Inactive', active: false, businessArea: 'bakery', collection: 'coll-1' },
    ];
    const result = analyzeProducts(products as never, defaultCollectionIds, defaultFormIds);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'p1');
  });

  it('includes active products by default when active is undefined', () => {
    const products = [
      { id: 'p1', name: 'No Active Flag', businessArea: 'bakery', collection: 'coll-1' },
    ];
    const result = analyzeProducts(products as never, defaultCollectionIds, defaultFormIds);
    assert.strictEqual(result.length, 1);
  });

  it('sets hasPrice to true when price is a non-zero number', () => {
    const products = [
      { id: 'p1', name: 'P1', active: true, price: 45, businessArea: 'bakery', collection: 'coll-1' },
    ];
    const result = analyzeProducts(products as never, defaultCollectionIds, defaultFormIds);
    assert.strictEqual(result[0].hasPrice, true);
  });

  it('sets hasPrice to false when price is undefined', () => {
    const products = [
      { id: 'p1', name: 'P1', active: true, businessArea: 'bakery', collection: 'coll-1' },
    ];
    const result = analyzeProducts(products as never, defaultCollectionIds, defaultFormIds);
    assert.strictEqual(result[0].hasPrice, false);
  });

  it('sets hasPrice to false when price is null', () => {
    const products = [
      { id: 'p1', name: 'P1', active: true, price: null, businessArea: 'bakery', collection: 'coll-1' },
    ];
    const result = analyzeProducts(products as never, defaultCollectionIds, defaultFormIds);
    assert.strictEqual(result[0].hasPrice, false);
  });

  it('sets hasPrice to false when price is 0', () => {
    const products = [
      { id: 'p1', name: 'P1', active: true, price: 0, businessArea: 'bakery', collection: 'coll-1' },
    ];
    const result = analyzeProducts(products as never, defaultCollectionIds, defaultFormIds);
    assert.strictEqual(result[0].hasPrice, false);
  });

  it('sets hasShortDescription to true when shortDescription has content', () => {
    const products = [
      { id: 'p1', name: 'P1', active: true, shortDescription: 'Yummy', businessArea: 'bakery', collection: 'coll-1' },
    ];
    const result = analyzeProducts(products as never, defaultCollectionIds, defaultFormIds);
    assert.strictEqual(result[0].hasShortDescription, true);
  });

  it('sets hasShortDescription to false when empty', () => {
    const products = [
      { id: 'p1', name: 'P1', active: true, shortDescription: '', businessArea: 'bakery', collection: 'coll-1' },
    ];
    const result = analyzeProducts(products as never, defaultCollectionIds, defaultFormIds);
    assert.strictEqual(result[0].hasShortDescription, false);
  });

  it('sets hasDescription to true when description has content', () => {
    const products = [
      { id: 'p1', name: 'P1', active: true, description: 'Long text', businessArea: 'bakery', collection: 'coll-1' },
    ];
    const result = analyzeProducts(products as never, defaultCollectionIds, defaultFormIds);
    assert.strictEqual(result[0].hasDescription, true);
  });

  it('sets hasDescription to false when empty', () => {
    const products = [
      { id: 'p1', name: 'P1', active: true, description: '', businessArea: 'bakery', collection: 'coll-1' },
    ];
    const result = analyzeProducts(products as never, defaultCollectionIds, defaultFormIds);
    assert.strictEqual(result[0].hasDescription, false);
  });

  it('validates collection reference', () => {
    const validCollections = new Set(['coll-1']);
    const products = [
      { id: 'p1', name: 'P1', active: true, collection: 'coll-1', businessArea: 'bakery' },
    ];
    const result = analyzeProducts(products as never, validCollections, defaultFormIds);
    assert.strictEqual(result[0].hasValidCollection, true);
  });

  it('flags invalid collection reference', () => {
    const validCollections = new Set(['coll-1']);
    const products = [
      { id: 'p1', name: 'P1', active: true, collection: 'missing-coll', businessArea: 'bakery' },
    ];
    const result = analyzeProducts(products as never, validCollections, defaultFormIds);
    assert.strictEqual(result[0].hasValidCollection, false);
  });

  it('validates form reference when formId is present', () => {
    const validForms = new Set(['form-1']);
    const products = [
      { id: 'p1', name: 'P1', active: true, formId: 'form-1', businessArea: 'bakery', collection: 'coll-1' },
    ];
    const result = analyzeProducts(products as never, defaultCollectionIds, validForms);
    assert.strictEqual(result[0].hasValidFormId, true);
  });

  it('flags invalid form reference', () => {
    const validForms = new Set(['form-1']);
    const products = [
      { id: 'p1', name: 'P1', active: true, formId: 'missing-form', businessArea: 'bakery', collection: 'coll-1' },
    ];
    const result = analyzeProducts(products as never, defaultCollectionIds, validForms);
    assert.strictEqual(result[0].hasValidFormId, false);
  });

  it('sets hasValidFormId to null when no formId', () => {
    const products = [
      { id: 'p1', name: 'P1', active: true, businessArea: 'bakery', collection: 'coll-1' },
    ];
    const result = analyzeProducts(products as never, defaultCollectionIds, defaultFormIds);
    assert.strictEqual(result[0].hasValidFormId, null);
  });

  it('counts images from images array when imageFolder scan returns none', () => {
    const products = [
      { id: 'p1', name: 'P1', active: true, images: ['a.jpg', 'b.jpg'], businessArea: 'bakery', collection: 'coll-1' },
    ];
    const result = analyzeProducts(products as never, defaultCollectionIds, defaultFormIds);
    assert.strictEqual(result[0].imageCount, 2);
  });

  it('sets imageScore based on image count', () => {
    const products = [
      { id: 'p1', name: 'P1', active: true, images: ['a.jpg', 'b.jpg'], businessArea: 'bakery', collection: 'coll-1' },
      { id: 'p2', name: 'P2', active: true, images: ['a.jpg'], businessArea: 'bakery', collection: 'coll-1' },
      { id: 'p3', name: 'P3', active: true, businessArea: 'bakery', collection: 'coll-1' },
    ];
    const result = analyzeProducts(products as never, defaultCollectionIds, defaultFormIds);
    assert.strictEqual(result[0].imageScore, 'PASS');
    assert.strictEqual(result[1].imageScore, 'WARN');
    assert.strictEqual(result[2].imageScore, 'FAIL');
  });

  it('uses default name when name is missing', () => {
    const products = [
      { id: 'p-123', active: true, businessArea: 'bakery', collection: 'coll-1' },
    ];
    const result = analyzeProducts(products as never, defaultCollectionIds, defaultFormIds);
    assert.strictEqual(result[0].name, 'p-123');
  });
});

describe('computeMetrics', () => {
  it('computes totals and averages correctly', () => {
    const analysis = [
      { imageCount: 5, isFeatured: true, isHomepageFeatured: true, isGalleryFeatured: true, hasShortDescription: true, hasDescription: true, hasPrice: true, hasValidFormId: true, id: 'p1', name: 'P1', hasBusinessArea: true, hasValidCollection: true, imageScore: 'PASS' },
      { imageCount: 1, isFeatured: false, isHomepageFeatured: false, isGalleryFeatured: true, hasShortDescription: false, hasDescription: false, hasPrice: false, hasValidFormId: false, id: 'p2', name: 'P2', hasBusinessArea: true, hasValidCollection: true, imageScore: 'WARN' },
    ] as never;
    const m = computeMetrics(analysis);
    assert.strictEqual(m.totalProducts, 2);
    assert.strictEqual(m.activeProducts, 2);
    assert.strictEqual(m.featuredProducts, 1);
    assert.strictEqual(m.homepageFeatured, 1);
    assert.strictEqual(m.galleryFeatured, 2);
    assert.strictEqual(m.totalImages, 6);
    assert.strictEqual(m.averageImagesPerProduct, 3);
    assert.strictEqual(m.missingShortDescriptions, 1);
    assert.strictEqual(m.missingDescriptions, 1);
    assert.strictEqual(m.missingPrices, 1);
    assert.strictEqual(m.missingFormRefs, 1);
    assert.strictEqual(m.productsWithNoImages, 0);
    assert.strictEqual(m.productsWithOneImage, 1);
  });

  it('returns zeros for empty analysis', () => {
    const m = computeMetrics([]);
    assert.strictEqual(m.totalProducts, 0);
    assert.strictEqual(m.averageImagesPerProduct, 0);
    assert.strictEqual(m.missingShortDescriptions, 0);
    assert.strictEqual(m.missingDescriptions, 0);
    assert.strictEqual(m.missingPrices, 0);
    assert.strictEqual(m.missingFormRefs, 0);
    assert.strictEqual(m.productsWithNoImages, 0);
    assert.strictEqual(m.productsWithOneImage, 0);
  });

  it('rounds averageImagesPerProduct to 1 decimal', () => {
    const analysis = [
      { imageCount: 3, isFeatured: false, isHomepageFeatured: false, isGalleryFeatured: true, hasShortDescription: true, hasDescription: true, hasPrice: true, hasValidFormId: null, id: 'p1', name: 'P1', hasBusinessArea: true, hasValidCollection: true, imageScore: 'PASS' },
      { imageCount: 2, isFeatured: false, isHomepageFeatured: false, isGalleryFeatured: true, hasShortDescription: true, hasDescription: true, hasPrice: true, hasValidFormId: null, id: 'p2', name: 'P2', hasBusinessArea: true, hasValidCollection: true, imageScore: 'PASS' },
    ] as never;
    const m = computeMetrics(analysis);
    assert.strictEqual(m.averageImagesPerProduct, 2.5);
  });
});

describe('computeFormCoverage', () => {
  it('tracks referenced form IDs', () => {
    const products = [
      { id: 'p1', formId: 'form-1' },
      { id: 'p2', formId: 'form-2' },
      { id: 'p3' },
    ] as never;
    const validFormIds = new Set(['form-1', 'form-2', 'form-3']);
    const fc = computeFormCoverage(products, validFormIds);
    assert.strictEqual(fc.productsWithForms, 2);
    assert.strictEqual(fc.uniqueFormIds, 2);
    assert.strictEqual(fc.valid, 2);
    assert.strictEqual(fc.missing, 0);
  });

  it('detects missing form IDs', () => {
    const products = [
      { id: 'p1', formId: 'form-1' },
      { id: 'p2', formId: 'missing-form' },
    ] as never;
    const validFormIds = new Set(['form-1']);
    const fc = computeFormCoverage(products, validFormIds);
    assert.strictEqual(fc.uniqueFormIds, 2);
    assert.strictEqual(fc.valid, 1);
    assert.strictEqual(fc.missing, 1);
    assert.deepStrictEqual(fc.missingIds, ['missing-form']);
  });

  it('returns zeros when no products have formId', () => {
    const products = [
      { id: 'p1' },
      { id: 'p2' },
    ] as never;
    const fc = computeFormCoverage(products, new Set(['form-1']));
    assert.strictEqual(fc.productsWithForms, 0);
    assert.strictEqual(fc.uniqueFormIds, 0);
    assert.strictEqual(fc.valid, 0);
    assert.strictEqual(fc.missing, 0);
    assert.deepStrictEqual(fc.missingIds, []);
  });
});

describe('calculateBusinessScore', () => {
  it('starts at 100 for perfect data', () => {
    const analysis = [] as never;
    const metrics = {
      missingPrices: 0, missingShortDescriptions: 0, missingDescriptions: 0,
      productsWithNoImages: 0, productsWithOneImage: 0,
    } as never;
    const formCoverage = { missing: 0 } as never;
    assert.strictEqual(calculateBusinessScore(analysis, metrics, formCoverage), 100);
  });

  it('deducts 5 per missing price', () => {
    const metrics = {
      missingPrices: 2, missingShortDescriptions: 0, missingDescriptions: 0,
      productsWithNoImages: 0, productsWithOneImage: 0,
    } as never;
    assert.strictEqual(calculateBusinessScore([] as never, metrics, { missing: 0 } as never), 90);
  });

  it('deducts 2 per missing short description', () => {
    const metrics = {
      missingPrices: 0, missingShortDescriptions: 5, missingDescriptions: 0,
      productsWithNoImages: 0, productsWithOneImage: 0,
    } as never;
    assert.strictEqual(calculateBusinessScore([] as never, metrics, { missing: 0 } as never), 90);
  });

  it('deducts 2 per missing description', () => {
    const metrics = {
      missingPrices: 0, missingShortDescriptions: 0, missingDescriptions: 3,
      productsWithNoImages: 0, productsWithOneImage: 0,
    } as never;
    assert.strictEqual(calculateBusinessScore([] as never, metrics, { missing: 0 } as never), 94);
  });

  it('deducts 5 per product with no images', () => {
    const metrics = {
      missingPrices: 0, missingShortDescriptions: 0, missingDescriptions: 0,
      productsWithNoImages: 2, productsWithOneImage: 0,
    } as never;
    assert.strictEqual(calculateBusinessScore([] as never, metrics, { missing: 0 } as never), 90);
  });

  it('deducts 2 per product with one image', () => {
    const metrics = {
      missingPrices: 0, missingShortDescriptions: 0, missingDescriptions: 0,
      productsWithNoImages: 0, productsWithOneImage: 3,
    } as never;
    assert.strictEqual(calculateBusinessScore([] as never, metrics, { missing: 0 } as never), 94);
  });

  it('deducts 3 per missing form', () => {
    const metrics = {
      missingPrices: 0, missingShortDescriptions: 0, missingDescriptions: 0,
      productsWithNoImages: 0, productsWithOneImage: 0,
    } as never;
    assert.strictEqual(calculateBusinessScore([] as never, metrics, { missing: 4 } as never), 88);
  });

  it('floors score at 0', () => {
    const metrics = {
      missingPrices: 100, missingShortDescriptions: 0, missingDescriptions: 0,
      productsWithNoImages: 0, productsWithOneImage: 0,
    } as never;
    assert.strictEqual(calculateBusinessScore([] as never, metrics, { missing: 0 } as never), 0);
  });

  it('combines multiple deduction types', () => {
    const metrics = {
      missingPrices: 1, missingShortDescriptions: 2, missingDescriptions: 1,
      productsWithNoImages: 1, productsWithOneImage: 2,
    } as never;
    const score = calculateBusinessScore([] as never, metrics, { missing: 1 } as never);
    const expected = 100 - (1*5) - (2*2) - (1*2) - (1*5) - (2*2) - (1*3);
    assert.strictEqual(score, expected);
  });
});

describe('generateRecommendations', () => {
  it('generates HIGH priority for products with no images', () => {
    const analysis = [
      { id: 'p1', name: 'Product One', imageCount: 0, hasDescription: true, hasShortDescription: true, hasPrice: true, hasValidFormId: true, isFeatured: false, isHomepageFeatured: false, isGalleryFeatured: true, hasBusinessArea: true, hasValidCollection: true, imageScore: 'FAIL' },
    ] as never;
    const metrics = { missingShortDescriptions: 0, homepageFeatured: 5 } as never;
    const recs = generateRecommendations(analysis, metrics, { missing: 0, missingIds: [] } as never);
    const imageRecs = recs.filter(r => r.text.includes('has no images'));
    assert.strictEqual(imageRecs.length, 1);
    assert.strictEqual(imageRecs[0].priority, 'HIGH');
  });

  it('generates HIGH priority for products with only 1 image', () => {
    const analysis = [
      { id: 'p1', name: 'Product One', imageCount: 1, hasDescription: true, hasShortDescription: true, hasPrice: true, hasValidFormId: true, isFeatured: false, isHomepageFeatured: false, isGalleryFeatured: true, hasBusinessArea: true, hasValidCollection: true, imageScore: 'WARN' },
    ] as never;
    const metrics = { missingShortDescriptions: 0, homepageFeatured: 5 } as never;
    const recs = generateRecommendations(analysis, metrics, { missing: 0, missingIds: [] } as never);
    const imageRecs = recs.filter(r => r.text.includes('has only 1 image'));
    assert.strictEqual(imageRecs.length, 1);
    assert.strictEqual(imageRecs[0].priority, 'HIGH');
  });

  it('generates HIGH priority for products missing description', () => {
    const analysis = [
      { id: 'p1', name: 'Product One', imageCount: 3, hasDescription: false, hasShortDescription: true, hasPrice: true, hasValidFormId: true, isFeatured: false, isHomepageFeatured: false, isGalleryFeatured: true, hasBusinessArea: true, hasValidCollection: true, imageScore: 'PASS' },
    ] as never;
    const metrics = { missingShortDescriptions: 0, homepageFeatured: 5 } as never;
    const recs = generateRecommendations(analysis, metrics, { missing: 0, missingIds: [] } as never);
    const descRecs = recs.filter(r => r.text.includes('missing description'));
    assert.strictEqual(descRecs.length, 1);
    assert.strictEqual(descRecs[0].priority, 'HIGH');
  });

  it('generates MEDIUM priority for missing short descriptions', () => {
    const analysis = [
      { id: 'p1', name: 'P1', imageCount: 3, hasDescription: true, hasShortDescription: false, hasPrice: true, hasValidFormId: true, isFeatured: false, isHomepageFeatured: false, isGalleryFeatured: true, hasBusinessArea: true, hasValidCollection: true, imageScore: 'PASS' },
    ] as never;
    const metrics = { missingShortDescriptions: 1, homepageFeatured: 5 } as never;
    const recs = generateRecommendations(analysis, metrics, { missing: 0, missingIds: [] } as never);
    const shortDescRecs = recs.filter(r => r.text.includes('short descriptions'));
    assert.strictEqual(shortDescRecs.length, 1);
    assert.strictEqual(shortDescRecs[0].priority, 'MEDIUM');
  });

  it('generates HIGH priority for missing forms', () => {
    const analysis = [
      { id: 'p1', name: 'P1', imageCount: 3, hasDescription: true, hasShortDescription: true, hasPrice: true, hasValidFormId: true, isFeatured: false, isHomepageFeatured: false, isGalleryFeatured: true, hasBusinessArea: true, hasValidCollection: true, imageScore: 'PASS' },
    ] as never;
    const metrics = { missingShortDescriptions: 0, homepageFeatured: 5 } as never;
    const recs = generateRecommendations(analysis, metrics, { missing: 2, missingIds: ['form-a', 'form-b'] } as never);
    const formRecs = recs.filter(r => r.text.includes('form(s)'));
    assert.strictEqual(formRecs.length, 1);
    assert.strictEqual(formRecs[0].priority, 'HIGH');
  });

  it('generates MEDIUM priority for low homepageFeatured count', () => {
    const analysis = [] as never;
    const metrics = { missingShortDescriptions: 0, homepageFeatured: 2 } as never;
    const recs = generateRecommendations(analysis, metrics, { missing: 0, missingIds: [] } as never);
    const homeRecs = recs.filter(r => r.text.includes('homepage featured'));
    assert.strictEqual(homeRecs.length, 1);
    assert.strictEqual(homeRecs[0].priority, 'MEDIUM');
  });

  it('does not generate homepage recommendation when count >= 3', () => {
    const analysis = [] as never;
    const metrics = { missingShortDescriptions: 0, homepageFeatured: 3 } as never;
    const recs = generateRecommendations(analysis, metrics, { missing: 0, missingIds: [] } as never);
    const homeRecs = recs.filter(r => r.text.includes('homepage featured'));
    assert.strictEqual(homeRecs.length, 0);
  });
});
