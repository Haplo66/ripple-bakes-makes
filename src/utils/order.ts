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
    notes: item.notes ? sanitizeValue(item.notes) as string : undefined,
  })),
  customer: {},
  createdAt: new Date().toISOString(),
});

export { sanitizeValue };
