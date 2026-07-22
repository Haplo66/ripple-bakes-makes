import type { Cart, CartItem, CartItemInput } from '../types/cart';

const CART_STORAGE_KEY = 'honeycomb-cart';

const createEmptyCart = (): Cart => ({
  items: [],
});

const canUseStorage = (): boolean =>
  typeof window !== 'undefined' && Boolean(window.localStorage);

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
    typeof candidate.configuration === 'object' &&
    candidate.configuration !== null &&
    typeof candidate.quantity === 'number' &&
    candidate.quantity >= 1 &&
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

  return normalizedCart;
};

/** Adds a new item to the cart while preserving its selected configuration. */
export const addToCart = (item: CartItemInput): Cart => {
  const cart = getCart();
  const cartItem: CartItem = {
    ...item,
    id: item.id || createCartItemId(),
    quantity: Math.max(1, item.quantity),
  };

  return saveCart({
    ...cart,
    items: [...cart.items, cartItem],
  });
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
  if (canUseStorage()) {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  }

  return createEmptyCart();
};
