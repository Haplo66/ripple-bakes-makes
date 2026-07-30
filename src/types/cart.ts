/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

/** Captured product option values for a cart item. */
export type CartItemConfiguration = Record<string, string | string[] | boolean | number>;

/** Product snapshot and customer selections stored for a future order. */
export interface CartItem {
  /** Unique cart line item identifier. */
  id: string;

  collectionId: string;

  productId: string;

  /** Product title at the time it was added. */
  productTitle: string;

  /** Selected customization values such as flavor, size, color, or fabric. */
  configuration: CartItemConfiguration;

  quantity: number;

  price?: number | null;

  notes?: string;
}

/** Lightweight client-side cart for future inquiry and checkout flows. */
export interface Cart {
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}

/** Input required to create a new cart item. */
export type CartItemInput = Omit<CartItem, 'id'> & {
  id?: string;
};
