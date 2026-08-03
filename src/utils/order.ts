/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import type { Cart } from '../types/cart';
import type { Order } from '../types/order';

const stripPrefix = (key: string, productId: string): string => {
  const prefix = `${productId}--`;
  return key.startsWith(prefix) ? key.slice(prefix.length) : key;
};

const cleanConfiguration = (
  config: Record<string, string | string[] | boolean | number>,
  productId: string,
): Record<string, string | string[] | boolean | number> => {
  const cleaned: Record<string, string | string[] | boolean | number> = {};

  for (const [key, value] of Object.entries(config)) {
    cleaned[stripPrefix(key, productId)] = sanitizeValue(value);
  }

  return cleaned;
};

const sanitizeValue = (
  value: string | string[] | boolean | number,
): string | string[] | boolean | number => {
  if (typeof value === 'string') {
    return value.replace(/^([=+\-@])/, "'$1");
  }

  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v) as string);
  }

  return value;
};

/** Validates that a cart item has a usable price. */
const isValidPrice = (price: unknown): price is number =>
  typeof price === 'number' && Number.isFinite(price);

/** Computes the total price of a cart, matching the order line totals. */
export const getCartTotal = (cart: Cart): number =>
  cart.items.reduce(
    (sum, item) =>
      sum + (isValidPrice(item.price) ? (item.price as number) * item.quantity : 0),
    0,
  );

/** Computes the total price of an order from its line totals. */
export const getOrderTotal = (order: Order): number =>
  order.items.reduce((sum, item) => sum + item.totalPrice, 0);

/** Converts the current cart into a checkout-ready order payload. */
export const createOrderFromCart = (cart: Cart): Order => {
  const invalidItem = cart.items.find((item) => !isValidPrice(item.price));

  if (invalidItem) {
    throw new Error(
      `Cannot order "${invalidItem.productTitle}" — no price is set. Remove it from your cart and try again.`,
    );
  }

  return {
    items: cart.items.map((item) => ({
      productId: item.productId,
      collectionId: item.collectionId,
      productTitle: item.productTitle,
      quantity: item.quantity,
      price: item.price as number,
      totalPrice: (item.price as number) * item.quantity,
      configuration: cleanConfiguration(item.configuration, item.productId),
      notes: item.notes ? sanitizeValue(item.notes) as string : undefined,
    })),
    customer: {},
    createdAt: new Date().toISOString(),
  };
};

export { sanitizeValue };
