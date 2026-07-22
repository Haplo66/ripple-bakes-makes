import type { CollectionCategory, CollectionImageTone } from './collection';
import type { ProductCustomization } from './product-options';

/** Specific product types offered by Honeycomb Arts & Bakes. */
export type ProductCategory =
  | 'cake'
  | 'bread'
  | 'cookie'
  | 'filled-pocket'
  | 'shirt'
  | 'hat'
  | 'baby-product'
  | 'rice-pack';

/** Status indicating product availability. */
export type ProductStatus =
  | 'available'
  | 'seasonal'
  | 'out-of-stock'
  | 'preorder';

/** Product entity used across bakery and sewing offerings. */
export interface Product {
  /** Unique product identifier. */
  id: string;

  /** Parent collection identifier. */
  collectionId: string;

  /** Specific product type. */
  category: ProductCategory;

  /** Main business division. */
  businessArea: CollectionCategory;

  /** URL-friendly identifier. */
  slug: string;

  title: string;

  subtitle?: string;

  shortDescription: string;

  description: string;

  /** Optional product image path. */
  image: string | null;

  /** Placeholder styling when image is unavailable. */
  imageTone?: CollectionImageTone;

  status: ProductStatus;

  active: boolean;

  featured: boolean;

  displayOrder: number;

  /** Future inquiry form reference. */
  formId?: string;

  /** Display-only price information. */
  priceLabel?: string;

  /** Optional customization metadata for future product detail and inquiry flows. */
  customization?: ProductCustomization;
}
