import type { Product } from '../types/product';
import type { Collection } from '../types/collection';
import { sitePath } from './paths';

const buildImageUrl = (path: string): string => sitePath(`images/${path}`);

const primaryFromImages = (images: string[], imageFolder?: string): string | null => {
  if (images.length === 0) return null;
  const path = imageFolder ? `${imageFolder}/${images[0]}` : images[0];
  return buildImageUrl(path);
};

const allFromImages = (images: string[], imageFolder?: string): string[] => {
  if (images.length === 0) return [];
  return images.map((filename) => {
    const path = imageFolder ? `${imageFolder}/${filename}` : filename;
    return buildImageUrl(path);
  });
};

export const getProductImages = (product: Product): string[] =>
  allFromImages(product.images, product.imageFolder);

export const getProductPrimaryImage = (product: Product): string | null =>
  primaryFromImages(product.images, product.imageFolder);

export const getCollectionImages = (collection: Collection): string[] =>
  allFromImages(collection.images || [], collection.imageFolder);

export const getCollectionPrimaryImage = (collection: Collection): string | null =>
  primaryFromImages(collection.images || [], collection.imageFolder);
