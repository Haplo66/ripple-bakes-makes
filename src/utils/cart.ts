/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import type { Cart, CartItem, CartItemConfiguration, CartItemInput, ProductOptionValue } from '../types/cart';
import { getProductById } from '../data/products';
import { getOptionAdjustments, parseOptionValue } from './option-pricing';

const CART_STORAGE_KEY = 'ripple-cart';

const createEmptyCart = (): Cart => ({
  items: [],
});

const canUseStorage = (): boolean =>
  typeof window !== 'undefined' && Boolean(window.localStorage);

const isProductOptionValue = (value: unknown): value is ProductOptionValue =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ProductOptionValue).value === 'string' &&
  typeof (value as ProductOptionValue).priceAdjustment === 'number';

const isCartItemConfigurationValue = (value: unknown): boolean =>
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean' ||
  isProductOptionValue(value) ||
  (Array.isArray(value) && value.every(isCartItemConfigurationValue));

const isCartItemConfiguration = (value: unknown): value is Record<string, string | string[] | boolean | number | ProductOptionValue | ProductOptionValue[]> =>
  typeof value === 'object' &&
  value !== null &&
  Object.values(value).every(isCartItemConfigurationValue);

const isCartItem = (item: unknown): item is CartItem => {
  if (!item || typeof item !== 'object') {
    return false;
  }

  const candidate = item as Partial<CartItem>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.collectionId === 'string' &&
    typeof candidate.productId === 'string' &&
    typeof candidate.productTitle === 'string' &&
    isCartItemConfiguration(candidate.configuration) &&
    typeof candidate.quantity === 'number' &&
    candidate.quantity >= 1 &&
    (typeof candidate.price === 'undefined' ||
      typeof candidate.price === 'number') &&
    (typeof candidate.notes === 'undefined' ||
      typeof candidate.notes === 'string')
  );
};

const normalizeCart = (cart: unknown): Cart => {
  if (!cart || typeof cart !== 'object') {
    return createEmptyCart();
  }

  const candidate = cart as Partial<Cart>;

  if (!Array.isArray(candidate.items)) {
    return createEmptyCart();
  }

  return {
    items: candidate.items.filter(isCartItem),
    createdAt:
      typeof candidate.createdAt === 'string'
        ? candidate.createdAt
        : undefined,
    updatedAt:
      typeof candidate.updatedAt === 'string'
        ? candidate.updatedAt
        : undefined,
  };
};

const createCartItemId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `cart-item-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
};

const withUpdatedTimestamp = (cart: Cart): Cart => {
  const now = new Date().toISOString();

  return {
    ...cart,
    createdAt: cart.createdAt || now,
    updatedAt: now,
  };
};

const dispatchCartUpdate = (cart: Cart): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('ripple-cart:updated', {
      detail: cart,
    }),
  );
};

/** Returns the current cart, falling back safely when storage is empty or invalid. */
export const getCart = (): Cart => {
  if (!canUseStorage()) {
    return createEmptyCart();
  }

  const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);

  if (!storedCart) {
    return createEmptyCart();
  }

  try {
    return normalizeCart(JSON.parse(storedCart));
  } catch {
    return createEmptyCart();
  }
};

/** Persists the provided cart in localStorage. */
export const saveCart = (cart: Cart): Cart => {
  const normalizedCart = withUpdatedTimestamp(normalizeCart(cart));

  if (canUseStorage()) {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(normalizedCart),
    );
  }

  dispatchCartUpdate(normalizedCart);

  return normalizedCart;
};

/** Adds a new item to the cart while preserving its selected configuration. */
export const addToCart = (item: CartItemInput): Cart => {
  const product = getProductById(item.productId);

  if (
    !product ||
    !product.active ||
    product.status === 'inactive' ||
    product.price == null ||
    !Number.isFinite(product.price)
  ) {
    return getCart();
  }

  const cart = getCart();
  const parsedConfiguration = parseConfiguration(item.configuration);
  const optionAdjustment = getOptionAdjustments(parsedConfiguration);
  const itemPrice = product.price + optionAdjustment;

  const cartItem: CartItem = {
    ...item,
    id: item.id || createCartItemId(),
    quantity: Math.max(1, item.quantity),
    price: itemPrice,
    configuration: parsedConfiguration,
  };

  return saveCart({
    ...cart,
    items: [...cart.items, cartItem],
  });
};

const parseConfiguration = (
  configuration: CartItemConfiguration,
): Record<string, string | string[] | boolean | number | ProductOptionValue | ProductOptionValue[]> => {
  const parsed: Record<string, string | string[] | boolean | number | ProductOptionValue | ProductOptionValue[]> = {};

  for (const [key, value] of Object.entries(configuration)) {
    if (Array.isArray(value)) {
      parsed[key] = value.map((v) =>
        typeof v === 'string' ? parseOptionValue(v) : v,
      );
    } else if (typeof value === 'string') {
      parsed[key] = parseOptionValue(value);
    } else {
      parsed[key] = value;
    }
  }

  return parsed;
};

/** Updates a cart item quantity, never allowing a quantity below one. */
export const updateCartItemQuantity = (
  itemId: string,
  quantity: number,
): Cart => {
  const cart = getCart();

  return saveCart({
    ...cart,
    items: cart.items.map((item) =>
      item.id === itemId
        ? { ...item, quantity: Math.max(1, quantity) }
        : item,
    ),
  });
};

/** Removes one selected cart item by its unique item ID. */
export const removeFromCart = (itemId: string): Cart => {
  const cart = getCart();

  return saveCart({
    ...cart,
    items: cart.items.filter((item) => item.id !== itemId),
  });
};

/** Clears all cart items from localStorage. */
export const clearCart = (): Cart => {
  const emptyCart = createEmptyCart();

  if (canUseStorage()) {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  }

  dispatchCartUpdate(emptyCart);

  return emptyCart;
};
