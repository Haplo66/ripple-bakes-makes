/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  galleryStory,
  getGalleryItems,
  getProductGalleryItems,
  getPersonalGalleryItems,
} from '../../src/utils/gallery.ts';
import { getAllProducts } from '../../src/data/products.ts';

describe('galleryStory', () => {
  it('prefers the product description', () => {
    const story = galleryStory(
      'Full product description',
      'Short card copy',
      'Product Name',
    );
    assert.strictEqual(story, 'Full product description');
  });

  it('falls back to the short description', () => {
    const story = galleryStory('', 'Short card copy', 'Product Name');
    assert.strictEqual(story, 'Short card copy');
  });

  it('falls back to the name', () => {
    const story = galleryStory('', '', 'Product Name');
    assert.strictEqual(story, 'Product Name');
  });

  it('trims surrounding whitespace before selecting a source', () => {
    assert.strictEqual(galleryStory('   ', '  short  ', 'Name'), 'short');
  });

  it('uses whitespace-only values as empty', () => {
    assert.strictEqual(galleryStory('', '  ', 'Name'), 'Name');
  });
});

describe('getProductGalleryItems', () => {
  it('resolves every gallery product to its story, link, and CTA', () => {
    const items = getProductGalleryItems();
    assert.ok(items.length > 0);
    for (const item of items) {
      assert.strictEqual(item.sourceType, 'product');
      assert.ok(item.title.length > 0, 'product item needs a title');
      assert.ok(item.description && item.description.length > 0, 'product item needs a story');
      assert.ok(item.href && item.href.startsWith('/'), 'product item needs a page link');
      assert.strictEqual(item.cta, 'View Product');
    }
  });

  it('excludes products not flagged for the gallery', () => {
    const galleryOff = getAllProducts().filter((p) => p.galleryFeatured === false);
    const items = getProductGalleryItems();
    for (const product of galleryOff) {
      const present = items.some((item) => item.title === product.title);
      assert.strictEqual(present, false, `${product.title} should not appear in the gallery`);
    }
  });

  it('links each item to a resolvable product page', () => {
    const items = getProductGalleryItems();
    for (const item of items) {
      assert.ok(
        item.href?.match(/^\/(bakery|sewing)\/[^/]+\/[^/]+$/),
        `unexpected href: ${item.href}`,
      );
    }
  });
});

describe('getPersonalGalleryItems', () => {
  it('derives a title from the filename and carries no link', () => {
    const items = getPersonalGalleryItems();
    for (const item of items) {
      assert.strictEqual(item.sourceType, 'personal');
      assert.strictEqual(item.businessArea, null);
      assert.ok(item.title.length > 0);
      assert.strictEqual(item.href, undefined);
    }
  });
});

describe('getGalleryItems', () => {
  it('deduplicates images across sources', () => {
    const items = getGalleryItems();
    const images = items.map((item) => item.image);
    assert.strictEqual(new Set(images).size, images.length);
  });

  it('includes product, collection, and personal sources', () => {
    const items = getGalleryItems();
    const types = new Set(items.map((item) => item.sourceType));
    assert.ok(types.has('product'));
    assert.ok(types.has('collection'));
    assert.ok(types.has('personal'));
  });

  it('gives linked items a story', () => {
    const items = getGalleryItems();
    for (const item of items.filter((i) => i.href)) {
      assert.ok(item.description && item.description.length > 0);
    }
  });
});
