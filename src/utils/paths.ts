import type { Product } from '../types/product';
import { collections } from '../data/collections';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export const sitePath = (path = ''): string => {
  const normalizedPath = path.replace(/^\/+/, '');

  return normalizedPath ? `${basePath}/${normalizedPath}` : `${basePath}/`;
};

export const collectionPath = (category: string, slug: string): string =>
  sitePath(`${category}/${slug}`);

export const productPath = (
  category: string,
  collectionSlug: string,
  productSlug: string,
): string => sitePath(`${category}/${collectionSlug}/${productSlug}`);

export const getProductPath = (product: Product): string => {
  const collection = collections.find((item) => item.id === product.collectionId);
  const collectionSlug =
    collection?.slug || product.collectionId.replace(`${product.businessArea}-`, '');
  return productPath(product.businessArea, collectionSlug, product.slug);
};
