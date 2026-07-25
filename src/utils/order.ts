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
    cleaned[stripPrefix(key, productId)] = value;
  }

  return cleaned;
};

/** Converts the current cart into a checkout-ready order payload. */
export const createOrderFromCart = (cart: Cart): Order => ({
  items: cart.items.map((item) => ({
    productId: item.productId,
    collectionId: item.collectionId,
    productTitle: item.productTitle,
    quantity: item.quantity,
    price: item.price ?? 0,
    totalPrice: (item.price ?? 0) * item.quantity,
    configuration: cleanConfiguration(item.configuration, item.productId),
    notes: item.notes,
  })),
  customer: {},
  createdAt: new Date().toISOString(),
});
