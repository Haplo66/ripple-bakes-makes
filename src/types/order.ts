/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import type { CartItemConfiguration } from './cart';

/** Optional customer details reserved for the future checkout flow. */
export interface OrderCustomer {
  name?: string;
  email?: string;
  phone?: string;
  preferredContactMethod?: string;
  preferredPickupDate?: string;
  additionalNotes?: string;
}

/** Product snapshot and customization details prepared for checkout. */
export interface OrderItem {
  productId: string;
  collectionId: string;
  productTitle: string;
  quantity: number;
  price: number;
  totalPrice: number;
  configuration: CartItemConfiguration;
  notes?: string;
}

/** Structured order payload generated from the client-side cart. */
export interface Order {
  items: OrderItem[];
  customer?: OrderCustomer;
  createdAt: string;
}
