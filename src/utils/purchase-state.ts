/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import type { Product } from '../types/product';

export type PurchaseState = 'purchasable' | 'coming-soon' | 'unavailable';

export const getPurchaseState = (product: Pick<Product, 'active' | 'price' | 'status'>): PurchaseState => {
  if (product.status === 'inactive') {
    return 'coming-soon';
  }

  if (product.active && product.price != null && Number.isFinite(product.price)) {
    return 'purchasable';
  }

  if (product.active) {
    return 'coming-soon';
  }

  return 'unavailable';
};
