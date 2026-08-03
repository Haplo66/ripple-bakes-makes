/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import type { CollectionCategory, CollectionImageTone } from './collection';

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
  | 'preorder'
  | 'inactive';

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

  /** Primary product image, resolved via image fallback hierarchy. */
  primaryImage: string;

  /** All product image paths. */
  images: string[];

  /** Resolved image folder (product-specific, collection-level, or business-area). */
  imageFolder: string;

  /** Placeholder styling when image is unavailable. */
  imageTone?: CollectionImageTone;

  status: ProductStatus;

  active: boolean;

  featured: boolean;

  /** Flagged for spotlight placement on the homepage. */
  homepageFeatured: boolean;

  /** Controls whether the product appears in the gallery page. Defaults to true. */
  galleryFeatured: boolean;

  displayOrder: number;

  /** Future inquiry form reference. */
  formId?: string;

  /** Numeric price for consistent formatting and sorting. */
  price?: number | null;

  /** Display-only price information. */
  priceLabel?: string;

  /** Customer-facing availability wording (e.g. "Made to Order", "In Stock"). */
  availability?: string;

  /** Estimated preparation time (e.g. "2–3 Business Days"). */
  preparationTime?: string;

  /** Fulfillment option used to generate customer-facing copy (e.g. "Pickup or Shipping"). */
  fulfillment?: string;
}
