/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { getAllProducts } from '../data/products';
import { getAllCollections } from '../data/collections';
import { getProductPrimaryImage, getCollectionPrimaryImage } from './images';
import { sitePath } from './paths';
import galleryAssets from '../content/gallery-assets.json';

export interface GalleryItem {
  image: string;
  title: string;
  businessArea: 'bakery' | 'sewing' | null;
  sourceType: 'product' | 'collection' | 'personal';
}

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
