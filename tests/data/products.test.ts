/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';

interface ProductRecord {
  id: string;
  businessArea: string;
  collection: string;
  category?: string;
  slug: string;
  name: string;
  subtitle?: string;
  shortDescription: string;
  description?: string;
  status: string;
  featured: boolean;
  homepageFeatured: boolean;
  galleryFeatured: boolean;
  formId: string;
  image: string | null;
  primaryImage: string;
  images: string[];
  imageFolder: string;
  imageTone?: string;
  active: boolean;
  displayOrder: number;
  price?: number;
  priceLabel?: string;
  title?: string;
}

describe('toProduct', () => {
  let toProduct: (record: ProductRecord) => Record<string, unknown>;

  before(async () => {
    const mod = await import('../../src/data/products.ts');
    toProduct = mod.toProduct as (record: ProductRecord) => Record<string, unknown>;
  });

  it('maps businessArea correctly for bakery', () => {
    const result = toProduct({
      id: 'test', businessArea: 'bakery', collection: 'test', slug: 'test',
      name: 'Test', shortDescription: 'desc', status: 'Active',
      featured: false, homepageFeatured: false, galleryFeatured: true,
      formId: '', image: null, primaryImage: '', images: [], imageFolder: '',
      active: true, displayOrder: 1,
    });
    assert.strictEqual(result.businessArea, 'bakery');
  });

  it('maps businessArea correctly for sewing', () => {
    const result = toProduct({
      id: 'test', businessArea: 'sewing', collection: 'test', slug: 'test',
      name: 'Test', shortDescription: 'desc', status: 'Active',
      featured: false, homepageFeatured: false, galleryFeatured: true,
      formId: '', image: null, primaryImage: '', images: [], imageFolder: '',
      active: true, displayOrder: 1,
    });
    assert.strictEqual(result.businessArea, 'sewing');
  });

  it('maps Active status to available', () => {
    const result = toProduct({
      id: 'test', businessArea: 'bakery', collection: 'test', slug: 'test',
      name: 'Test', shortDescription: 'desc', status: 'Active',
      featured: false, homepageFeatured: false, galleryFeatured: true,
      formId: '', image: null, primaryImage: '', images: [], imageFolder: '',
      active: true, displayOrder: 1,
    });
    assert.strictEqual(result.status, 'available');
  });

  it('maps unknown status to available fallback', () => {
    const result = toProduct({
      id: 'test', businessArea: 'bakery', collection: 'test', slug: 'test',
      name: 'Test', shortDescription: 'desc', status: 'UnknownStatus',
      featured: false, homepageFeatured: false, galleryFeatured: true,
      formId: '', image: null, primaryImage: '', images: [], imageFolder: '',
      active: true, displayOrder: 1,
    });
    assert.strictEqual(result.status, 'available');
  });

  it('defaults active to true when undefined', () => {
    const result = toProduct({
      id: 'test', businessArea: 'bakery', collection: 'test', slug: 'test',
      name: 'Test', shortDescription: 'desc', status: 'Active',
      featured: false, homepageFeatured: false, galleryFeatured: true,
      formId: '', image: null, primaryImage: '', images: [], imageFolder: '',
      active: undefined as unknown as boolean, displayOrder: 1,
    });
    assert.strictEqual(result.active, true);
  });

  it('defaults featured to false when undefined', () => {
    const result = toProduct({
      id: 'test', businessArea: 'bakery', collection: 'test', slug: 'test',
      name: 'Test', shortDescription: 'desc', status: 'Active',
      featured: undefined as unknown as boolean, homepageFeatured: false,
      galleryFeatured: true, formId: '', image: null, primaryImage: '',
      images: [], imageFolder: '', active: true, displayOrder: 1,
    });
    assert.strictEqual(result.featured, false);
  });

  it('defaults galleryFeatured to true when undefined', () => {
    const result = toProduct({
      id: 'test', businessArea: 'bakery', collection: 'test', slug: 'test',
      name: 'Test', shortDescription: 'desc', status: 'Active',
      featured: false, homepageFeatured: false,
      galleryFeatured: undefined as unknown as boolean,
      formId: '', image: null, primaryImage: '', images: [], imageFolder: '',
      active: true, displayOrder: 1,
    });
    assert.strictEqual(result.galleryFeatured, true);
  });

  it('falls back description to shortDescription when description is empty', () => {
    const result = toProduct({
      id: 'test', businessArea: 'bakery', collection: 'test', slug: 'test',
      name: 'Test', shortDescription: 'fallback text', description: '',
      status: 'Active', featured: false, homepageFeatured: false,
      galleryFeatured: true, formId: '', image: null, primaryImage: '',
      images: [], imageFolder: '', active: true, displayOrder: 1,
    });
    assert.strictEqual(result.description, 'fallback text');
  });

  it('uses description when provided', () => {
    const result = toProduct({
      id: 'test', businessArea: 'bakery', collection: 'test', slug: 'test',
      name: 'Test', shortDescription: 'short', description: 'long description',
      status: 'Active', featured: false, homepageFeatured: false,
      galleryFeatured: true, formId: '', image: null, primaryImage: '',
      images: [], imageFolder: '', active: true, displayOrder: 1,
    });
    assert.strictEqual(result.description, 'long description');
  });

  it('falls back image to images[0] when image is null', () => {
    const result = toProduct({
      id: 'test', businessArea: 'bakery', collection: 'test', slug: 'test',
      name: 'Test', shortDescription: 'desc', status: 'Active',
      featured: false, homepageFeatured: false, galleryFeatured: true,
      formId: '', image: null, primaryImage: '', images: ['photo.jpg'],
      imageFolder: '', active: true, displayOrder: 1,
    });
    assert.strictEqual(result.image, 'photo.jpg');
  });

  it('returns null for image when both image and images are empty', () => {
    const result = toProduct({
      id: 'test', businessArea: 'bakery', collection: 'test', slug: 'test',
      name: 'Test', shortDescription: 'desc', status: 'Active',
      featured: false, homepageFeatured: false, galleryFeatured: true,
      formId: '', image: null, primaryImage: '', images: [], imageFolder: '',
      active: true, displayOrder: 1,
    });
    assert.strictEqual(result.image, null);
  });

  it('falls back category to slug when category is empty', () => {
    const result = toProduct({
      id: 'test', businessArea: 'bakery', collection: 'test', slug: 'my-slug',
      name: 'Test', shortDescription: 'desc', category: '', status: 'Active',
      featured: false, homepageFeatured: false, galleryFeatured: true,
      formId: '', image: null, primaryImage: '', images: [], imageFolder: '',
      active: true, displayOrder: 1,
    });
    assert.strictEqual(result.category, 'my-slug');
  });

  it('defaults imageTone to cream when not provided', () => {
    const result = toProduct({
      id: 'test', businessArea: 'bakery', collection: 'test', slug: 'test',
      name: 'Test', shortDescription: 'desc', status: 'Active',
      featured: false, homepageFeatured: false, galleryFeatured: true,
      formId: '', image: null, primaryImage: '', images: [], imageFolder: '',
      imageTone: undefined, active: true, displayOrder: 1,
    });
    assert.strictEqual(result.imageTone, 'cream');
  });

  it('defaults displayOrder to 0 when undefined', () => {
    const result = toProduct({
      id: 'test', businessArea: 'bakery', collection: 'test', slug: 'test',
      name: 'Test', shortDescription: 'desc', status: 'Active',
      featured: false, homepageFeatured: false, galleryFeatured: true,
      formId: '', image: null, primaryImage: '', images: [], imageFolder: '',
      active: true, displayOrder: undefined as unknown as number,
    });
    assert.strictEqual(result.displayOrder, 0);
  });

  it('maps Seasonal status correctly', () => {
    const result = toProduct({
      id: 'test', businessArea: 'bakery', collection: 'test', slug: 'test',
      name: 'Test', shortDescription: 'desc', status: 'Seasonal',
      featured: false, homepageFeatured: false, galleryFeatured: true,
      formId: '', image: null, primaryImage: '', images: [], imageFolder: '',
      active: true, displayOrder: 1,
    });
    assert.strictEqual(result.status, 'seasonal');
  });

  it('maps Preorder status correctly', () => {
    const result = toProduct({
      id: 'test', businessArea: 'bakery', collection: 'test', slug: 'test',
      name: 'Test', shortDescription: 'desc', status: 'Preorder',
      featured: false, homepageFeatured: false, galleryFeatured: true,
      formId: '', image: null, primaryImage: '', images: [], imageFolder: '',
      active: true, displayOrder: 1,
    });
    assert.strictEqual(result.status, 'preorder');
  });

  it('maps Out of Stock status correctly', () => {
    const result = toProduct({
      id: 'test', businessArea: 'bakery', collection: 'test', slug: 'test',
      name: 'Test', shortDescription: 'desc', status: 'Out of Stock',
      featured: false, homepageFeatured: false, galleryFeatured: true,
      formId: '', image: null, primaryImage: '', images: [], imageFolder: '',
      active: true, displayOrder: 1,
    });
    assert.strictEqual(result.status, 'out-of-stock');
  });
});

describe('product queries', () => {
  let getAllProducts: () => Record<string, unknown>[];
  let getProductsByCollection: (id: string) => Record<string, unknown>[];
  let getFeaturedProducts: (area?: string) => Record<string, unknown>[];
  let getHomepageFeatured: () => Record<string, unknown>[];
  let getProductById: (id: string) => Record<string, unknown> | undefined;
  let getAllProductsForPaths: () => Record<string, unknown>[];
  let getProductsByBusinessArea: (area: string) => Record<string, unknown>[];

  before(async () => {
    const mod = await import('../../src/data/products.ts');
    getAllProducts = mod.getAllProducts as () => Record<string, unknown>[];
    getProductsByCollection = mod.getProductsByCollection as (id: string) => Record<string, unknown>[];
    getFeaturedProducts = mod.getFeaturedProducts as (area?: string) => Record<string, unknown>[];
    getHomepageFeatured = mod.getHomepageFeatured as () => Record<string, unknown>[];
    getProductById = mod.getProductById as (id: string) => Record<string, unknown> | undefined;
    getAllProductsForPaths = mod.getAllProductsForPaths as () => Record<string, unknown>[];
    getProductsByBusinessArea = mod.getProductsByBusinessArea as (area: string) => Record<string, unknown>[];
  });

  it('getAllProducts returns only active products', () => {
    const result = getAllProducts();
    for (const p of result) {
      assert.strictEqual(
        (p as { active: boolean }).active,
        true,
        `Product ${(p as { id: string }).id} should be active`,
      );
    }
  });

  it('getAllProducts returns products sorted by displayOrder', () => {
    const result = getAllProducts();
    const orders = result.map((p) => (p as { displayOrder: number }).displayOrder);
    for (let i = 1; i < orders.length; i++) {
      assert.ok(orders[i - 1] <= orders[i], 'Products should be sorted by displayOrder');
    }
  });

  it('getProductsByCollection filters by collection ID', () => {
    const result = getProductsByCollection('bakery-cakes');
    for (const p of result) {
      assert.strictEqual(
        (p as { collectionId: string }).collectionId,
        'bakery-cakes',
      );
    }
  });

  it('getProductsByCollection returns only active products', () => {
    const result = getProductsByCollection('bakery-breads');
    for (const p of result) {
      assert.strictEqual((p as { active: boolean }).active, true);
    }
  });

  it('getProductsByCollection returns empty array for unknown collection', () => {
    const result = getProductsByCollection('nonexistent-collection-id');
    assert.deepStrictEqual(result, []);
  });

  it('getFeaturedProducts returns only featured active products', () => {
    const result = getFeaturedProducts();
    for (const p of result) {
      assert.strictEqual((p as { active: boolean }).active, true);
      assert.strictEqual((p as { featured: boolean }).featured, true);
    }
  });

  it('getFeaturedProducts scoped to business area', () => {
    const bakery = getFeaturedProducts('bakery');
    const sewing = getFeaturedProducts('sewing');
    for (const p of bakery) {
      assert.strictEqual((p as { businessArea: string }).businessArea, 'bakery');
    }
    for (const p of sewing) {
      assert.strictEqual((p as { businessArea: string }).businessArea, 'sewing');
    }
  });

  it('getHomepageFeatured returns only homepageFeatured products', () => {
    const result = getHomepageFeatured();
    for (const p of result) {
      assert.strictEqual(
        (p as { homepageFeatured: boolean }).homepageFeatured,
        true,
      );
    }
  });

  it('getProductById returns a product matching the ID', () => {
    const all = getAllProducts();
    const firstId = (all[0] as { id: string }).id;
    const result = getProductById(firstId);
    assert.ok(result);
    assert.strictEqual((result as { id: string }).id, firstId);
  });

  it('getProductById returns undefined for unknown ID', () => {
    const result = getProductById('nonexistent-product-id');
    assert.strictEqual(result, undefined);
  });

  it('getAllProductsForPaths includes all products from the source data', () => {
    const result = getAllProductsForPaths();
    const activeCount = getAllProducts().length;
    assert.ok(result.length >= activeCount);
  });

  it('getProductsByBusinessArea filters by business area', () => {
    const bakery = getProductsByBusinessArea('bakery');
    const sewing = getProductsByBusinessArea('sewing');
    for (const p of bakery) {
      assert.strictEqual((p as { businessArea: string }).businessArea, 'bakery');
    }
    for (const p of sewing) {
      assert.strictEqual((p as { businessArea: string }).businessArea, 'sewing');
    }
  });

  it('getProductById returns inactive products', () => {
    const allPaths = getAllProductsForPaths();
    const inactive = allPaths.filter((p) => !(p as { active: boolean }).active);
    for (const product of inactive) {
      const found = getProductById((product as { id: string }).id);
      assert.ok(found, `getProductById should find inactive product ${(product as { id: string }).id}`);
    }
  });
});
