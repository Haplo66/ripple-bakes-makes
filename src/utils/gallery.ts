import { getAllProducts } from '../data/products';
import { getAllCollections } from '../data/collections';
import { getProductPrimaryImage } from './images';
import { getCollectionPrimaryImage } from './images';

export interface GalleryItem {
  image: string;
  title: string;
  businessArea: 'bakery' | 'sewing';
  source: 'product' | 'collection';
}

function isDistinctImage(url: string, seen: Set<string>): boolean {
  if (seen.has(url)) return false;
  seen.add(url);
  return true;
}

export function getGalleryItems(): GalleryItem[] {
  const items: GalleryItem[] = [];
  const seen = new Set<string>();

  for (const product of getAllProducts().filter((p) => p.galleryFeatured !== false)) {
    const image = getProductPrimaryImage(product);
    if (!image || !isDistinctImage(image, seen)) continue;
    items.push({
      image,
      title: product.title,
      businessArea: product.businessArea,
      source: 'product',
    });
  }

  for (const collection of getAllCollections()) {
    const image = getCollectionPrimaryImage(collection);
    if (!image || !isDistinctImage(image, seen)) continue;
    items.push({
      image,
      title: collection.title,
      businessArea: collection.category,
      source: 'collection',
    });
  }

  return items;
}
