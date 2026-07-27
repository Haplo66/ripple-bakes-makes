import type { Product } from '../types/product';

export type PurchaseState = 'purchasable' | 'coming-soon' | 'unavailable';

export const getPurchaseState = (product: Pick<Product, 'active' | 'price'>): PurchaseState => {
  if (product.active && product.price != null && Number.isFinite(product.price)) {
    return 'purchasable';
  }

  if (product.active) {
    return 'coming-soon';
  }

  return 'unavailable';
};
