/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved.
 *
 */

import type { Product, ProductCategory } from '../types/product';
import type { CollectionCategory, CollectionImageTone } from '../types/collection';
import productRecords from '../content/products.json';

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

const businessAreaMap: Record<string, CollectionCategory> = {
  bakery: 'bakery',
  sewing: 'sewing',
};

const statusMap: Record<string, Product['status']> = {
  Active: 'available',
  Seasonal: 'seasonal',
  'Out of Stock': 'out-of-stock',
  Preorder: 'preorder',
  available: 'available',
  seasonal: 'seasonal',
  'out-of-stock': 'out-of-stock',
  preorder: 'preorder',
};

const toProduct = (record: ProductRecord): Product => {
  const images = record.images || [];

  return {
    id: record.id,
    businessArea: businessAreaMap[record.businessArea] || record.businessArea as CollectionCategory,
    collection: record.collection,
    collectionId: record.collection,
    category: (record.category || record.slug) as ProductCategory,
    slug: record.slug,
    title: record.title || record.name,
    name: record.name,
    subtitle: record.subtitle,
    shortDescription: record.shortDescription,
    description: record.description || record.shortDescription,
    image: record.image || images[0] || null,
    primaryImage: record.primaryImage || '',
    images,
    imageFolder: record.imageFolder || '',
    imageTone: (record.imageTone || 'cream') as CollectionImageTone,
    status: statusMap[record.status] || 'available',
    active: record.active ?? true,
    featured: record.featured ?? false,
    homepageFeatured: record.homepageFeatured ?? false,
    galleryFeatured: record.galleryFeatured ?? true,
    displayOrder: record.displayOrder ?? 0,
    formId: record.formId,
    price: record.price,
    priceLabel: record.priceLabel,
  };
};

/** Product data loaded from JSON to support future spreadsheet-backed imports. */
const rawData = Array.isArray(productRecords)
  ? productRecords
  : productRecords.data;

export const products: readonly Product[] = rawData.map(toProduct);

const orderedActive = (items: readonly Product[]): Product[] =>
  items
    .filter((product) => product.active)
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder);

/** Returns all active products sorted by display order. */
export const getAllProducts = (): Product[] => orderedActive(products);

/** Returns active products belonging to a specific collection ID. */
export const getProductsByCollection = (
  collectionId: string,
): Product[] =>
  orderedActive(
    products.filter(
      (product) => product.collectionId === collectionId,
    ),
  );

/** Returns active products belonging to a specific business area. */
export const getProductsByBusinessArea = (
  area: Product['businessArea'],
): Product[] =>
  orderedActive(
    products.filter((product) => product.businessArea === area),
  );

/** Returns active featured products sorted by display order, optionally scoped to a business area. */
export const getFeaturedProducts = (
  area?: Product['businessArea'],
): Product[] =>
  area
    ? orderedActive(products.filter((p) => p.featured && p.businessArea === area))
    : orderedActive(products.filter((p) => p.featured));

/** Returns active homepage-featured products sorted by display order. */
export const getHomepageFeatured = (): Product[] =>
  orderedActive(products.filter((product) => product.homepageFeatured));

/** Returns all products (including inactive) sorted by display order, for static path generation. */
export const getAllProductsForPaths = (): Product[] =>
  products.slice().sort((a, b) => a.displayOrder - b.displayOrder);

/** Returns a product by unique ID, including inactive records. */
export const getProductById = (id: string): Product | undefined =>
  products.find((product) => product.id === id);

