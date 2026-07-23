import type { CollectionCategory, CollectionImageTone } from './collection';
import type { ProductCustomization } from './product-options';

/** Specific product types offered by RIPPLE Bakes & Makes. */
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

  /** Source collection identifier, kept sheet-friendly for future imports. */
  collection?: string;

  /** Specific product type. */
  category: ProductCategory;

  /** Main business division. */
  businessArea: CollectionCategory;

  /** URL-friendly identifier. */
  slug: string;

  title: string;

  /** Sheet-friendly product name. */
  name?: string;

  subtitle?: string;

  shortDescription: string;

  description: string;

  /** Optional primary product image path. */
  image: string | null;

  /** All product image paths. */
  images: string[];

  /** Folder that contains product imagery in future asset-backed imports. */
  imageFolder?: string;

  /** Placeholder styling when image is unavailable. */
  imageTone?: CollectionImageTone;

  status: ProductStatus;

  active: boolean;

  featured: boolean;

  displayOrder: number;

  /** Future inquiry form reference. */
  formId?: string;

  /** Numeric price for consistent formatting and sorting. */
  price?: number;

  /** Display-only price information. */
  priceLabel?: string;

  /** Optional customization metadata for future product detail and inquiry flows. */
  customization?: ProductCustomization;
}
