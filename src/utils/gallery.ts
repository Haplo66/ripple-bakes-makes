/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { getAllProducts } from '../data/products.ts';
import { getAllCollections } from '../data/collections.ts';
import { getProductPrimaryImage, getCollectionPrimaryImage } from './images.ts';
import { sitePath, getProductPath, collectionPath } from './paths.ts';
import galleryAssets from '../content/gallery-assets.json' with { type: 'json' };

export interface GalleryItem {
  image: string;
  title: string;
  description?: string;
  href?: string;
  cta?: string;
  businessArea: 'bakery' | 'sewing' | null;
  sourceType: 'product' | 'collection' | 'personal';
}

/**
 * Reuses existing product/collection copy for the gallery story,
 * falling back through description, short description, then the name.
 * Avoids duplicate caption content — Sheets remains the source of truth.
 */
export const galleryStory = (
  description: string | undefined,
  shortDescription: string | undefined,
  fallback: string,
): string => (description ?? '').trim() || (shortDescription ?? '').trim() || fallback;

function isDistinctImage(url: string, seen: Set<string>): boolean {
  if (seen.has(url)) return false;
  seen.add(url);
  return true;
}

export function getProductGalleryItems(): GalleryItem[] {
  const items: GalleryItem[] = [];
  const seen = new Set<string>();

  for (const product of getAllProducts().filter((p) => p.galleryFeatured !== false)) {
    const image = getProductPrimaryImage(product);
    if (!image || !isDistinctImage(image, seen)) continue;
    items.push({
      image,
      title: product.title,
      description: galleryStory(product.description, product.shortDescription, product.title),
      href: getProductPath(product),
      cta: 'View Product',
      businessArea: product.businessArea,
      sourceType: 'product',
    });
  }

  return items;
}

export function getCollectionGalleryItems(): GalleryItem[] {
  const items: GalleryItem[] = [];
  const seen = new Set<string>();

  for (const collection of getAllCollections()) {
    const image = getCollectionPrimaryImage(collection);
    if (!image || !isDistinctImage(image, seen)) continue;
    items.push({
      image,
      title: collection.title,
      description: galleryStory(collection.description, collection.shortDescription, collection.title),
      href: collectionPath(collection.category, collection.slug),
      cta: 'View Collection',
      businessArea: collection.category,
      sourceType: 'collection',
    });
  }

  return items;
}

export function getPersonalGalleryItems(): GalleryItem[] {
  const images = galleryAssets.data as string[];
  return images.map((file) => {
    const title = file
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/(^\w|\s\w)/g, (c) => c.toUpperCase());
    return {
      image: sitePath(`images/gallery/personal/${file}`),
      title,
      businessArea: null,
      sourceType: 'personal',
    };
  });
}

export function getGalleryItems(): GalleryItem[] {
  const seen = new Set<string>();
  const all = [
    ...getProductGalleryItems(),
    ...getCollectionGalleryItems(),
    ...getPersonalGalleryItems(),
  ];
  return all.filter((item) => isDistinctImage(item.image, seen));
}
