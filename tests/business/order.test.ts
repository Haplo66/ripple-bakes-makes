/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createOrderFromCart, getCartTotal, getOrderTotal, sanitizeValue } from '../../src/utils/order.ts';

describe('createOrderFromCart', () => {
  it('creates correct Order structure from a valid cart', () => {
    const cart = {
      items: [
        {
          id: 'item-1',
          productId: 'bakery-cakes-vanilla-cake',
          collectionId: 'bakery-cakes',
          productTitle: 'Vanilla Cake',
          quantity: 2,
          price: 45,
          configuration: { flavor: 'vanilla' },
        },
      ],
    };

    const order = createOrderFromCart(cart);

    assert.strictEqual(order.items.length, 1);
    assert.strictEqual(order.items[0].productId, 'bakery-cakes-vanilla-cake');
    assert.strictEqual(order.items[0].collectionId, 'bakery-cakes');
    assert.strictEqual(order.items[0].productTitle, 'Vanilla Cake');
    assert.strictEqual(order.items[0].quantity, 2);
    assert.strictEqual(order.items[0].price, 45);
    assert.strictEqual(order.items[0].configuration.flavor, 'vanilla');
    assert.strictEqual(typeof order.createdAt, 'string');
  });

  it('computes totalPrice as price multiplied by quantity', () => {
    const cart = {
      items: [
        {
          id: 'item-1',
          productId: 'bakery-cakes-vanilla-cake',
          collectionId: 'bakery-cakes',
          productTitle: 'Vanilla Cake',
          quantity: 3,
          price: 45,
          configuration: {},
        },
      ],
    };

    const order = createOrderFromCart(cart);
    assert.strictEqual(order.items[0].totalPrice, 135);
  });

  it('sets customer to empty object', () => {
    const cart = {
      items: [
        {
          id: 'item-1',
          productId: 'bakery-cakes-vanilla-cake',
          collectionId: 'bakery-cakes',
          productTitle: 'Vanilla Cake',
          quantity: 1,
          price: 45,
          configuration: {},
        },
      ],
    };

    const order = createOrderFromCart(cart);
    assert.deepStrictEqual(order.customer, {});
  });

  it('generates a createdAt timestamp', () => {
    const cart = {
      items: [
        {
          id: 'item-1',
          productId: 'bakery-cakes-vanilla-cake',
          collectionId: 'bakery-cakes',
          productTitle: 'Vanilla Cake',
          quantity: 1,
          price: 45,
          configuration: {},
        },
      ],
    };

    const before = Date.now();
    const order = createOrderFromCart(cart);
    const after = Date.now();
    const createdAt = new Date(order.createdAt).getTime();

    assert.ok(createdAt >= before);
    assert.ok(createdAt <= after);
  });

  it('throws when an item has no price set', () => {
    const cart = {
      items: [
        {
          id: 'item-1',
          productId: 'bakery-pies-no-price-pie',
          collectionId: 'bakery-pies',
          productTitle: 'No Price Pie',
          quantity: 1,
          price: undefined,
          configuration: {},
        },
      ],
    };

    assert.throws(
      () => createOrderFromCart(cart),
      { message: /Cannot order "No Price Pie"/ },
    );
  });

  it('throws with product name in error when price is null', () => {
    const cart = {
      items: [
        {
          id: 'item-1',
          productId: 'bakery-pies-no-price-pie',
          collectionId: 'bakery-pies',
          productTitle: 'No Price Pie',
          quantity: 1,
          price: null,
          configuration: {},
        },
      ],
    };

    assert.throws(
      () => createOrderFromCart(cart),
      { message: /"No Price Pie"/ },
    );
  });

  it('strips productId-- prefix from configuration keys', () => {
    const cart = {
      items: [
        {
          id: 'item-1',
          productId: 'bakery-cakes-vanilla-cake',
          collectionId: 'bakery-cakes',
          productTitle: 'Vanilla Cake',
          quantity: 1,
          price: 45,
          configuration: {
            'bakery-cakes-vanilla-cake--flavor': 'vanilla',
            'bakery-cakes-vanilla-cake--size': 'large',
          },
        },
      ],
    };

    const order = createOrderFromCart(cart);
    assert.strictEqual(order.items[0].configuration.flavor, 'vanilla');
    assert.strictEqual(order.items[0].configuration.size, 'large');
    assert.strictEqual(
      order.items[0].configuration['bakery-cakes-vanilla-cake--flavor'],
      undefined,
    );
  });

  it('preserves items without prefix in configuration keys', () => {
    const cart = {
      items: [
        {
          id: 'item-1',
          productId: 'bakery-cakes-vanilla-cake',
          collectionId: 'bakery-cakes',
          productTitle: 'Vanilla Cake',
          quantity: 1,
          price: 45,
          configuration: { flavor: 'vanilla' },
        },
      ],
    };

    const order = createOrderFromCart(cart);
    assert.strictEqual(order.items[0].configuration.flavor, 'vanilla');
  });

  it('handles empty items array', () => {
    const cart = { items: [] };
    const order = createOrderFromCart(cart);
    assert.deepStrictEqual(order.items, []);
  });

  it('includes notes when provided, sanitized', () => {
    const cart = {
      items: [
        {
          id: 'item-1',
          productId: 'bakery-cakes-vanilla-cake',
          collectionId: 'bakery-cakes',
          productTitle: 'Vanilla Cake',
          quantity: 1,
          price: 45,
          configuration: {},
          notes: 'Happy birthday!',
        },
      ],
    };

    const order = createOrderFromCart(cart);
    assert.strictEqual(order.items[0].notes, 'Happy birthday!');
  });

  it('includes no notes property when not provided', () => {
    const cart = {
      items: [
        {
          id: 'item-1',
          productId: 'bakery-cakes-vanilla-cake',
          collectionId: 'bakery-cakes',
          productTitle: 'Vanilla Cake',
          quantity: 1,
          price: 45,
          configuration: {},
        },
      ],
    };

    const order = createOrderFromCart(cart);
    assert.strictEqual(order.items[0].notes, undefined);
  });
});

describe('getCartTotal', () => {
  it('sums unit price times quantity across items', () => {
    const cart = {
      items: [
        { id: 'item-1', productId: 'p1', collectionId: 'c1', productTitle: 'One', quantity: 2, price: 12, configuration: {} },
        { id: 'item-2', productId: 'p2', collectionId: 'c2', productTitle: 'Two', quantity: 3, price: 6, configuration: {} },
      ],
    };

    assert.strictEqual(getCartTotal(cart), 42);
  });

  it('returns zero for an empty cart', () => {
    assert.strictEqual(getCartTotal({ items: [] }), 0);
  });

  it('ignores items without a finite price', () => {
    const cart = {
      items: [
        { id: 'item-1', productId: 'p1', collectionId: 'c1', productTitle: 'One', quantity: 2, price: null, configuration: {} },
        { id: 'item-2', productId: 'p2', collectionId: 'c2', productTitle: 'Two', quantity: 1, price: 10, configuration: {} },
      ],
    };

    assert.strictEqual(getCartTotal(cart), 10);
  });
});

describe('getOrderTotal', () => {
  it('sums the line totals of an order', () => {
    const order = {
      items: [
        { productId: 'p1', collectionId: 'c1', productTitle: 'One', quantity: 2, price: 12, totalPrice: 24, configuration: {} },
        { productId: 'p2', collectionId: 'c2', productTitle: 'Two', quantity: 1, price: 18, totalPrice: 18, configuration: {} },
      ],
      createdAt: new Date().toISOString(),
    };

    assert.strictEqual(getOrderTotal(order), 42);
  });

  it('matches the cart total used to build the order', () => {
    const cart = {
      items: [
        { id: 'item-1', productId: 'p1', collectionId: 'c1', productTitle: 'One', quantity: 2, price: 12, configuration: {} },
        { id: 'item-2', productId: 'p2', collectionId: 'c2', productTitle: 'Two', quantity: 3, price: 6, configuration: {} },
      ],
    };

    const order = createOrderFromCart(cart);
    assert.strictEqual(getOrderTotal(order), getCartTotal(cart));
  });
});

describe('sanitizeValue', () => {
  it('prefixes equals sign with single quote', () => {
    assert.strictEqual(sanitizeValue('=SUM(A1:A10)'), "'=SUM(A1:A10)");
  });

  it('prefixes plus sign with single quote', () => {
    assert.strictEqual(sanitizeValue('+cmd'), "'+cmd");
  });

  it('prefixes hyphen with single quote', () => {
    assert.strictEqual(sanitizeValue('-cmd'), "'-cmd");
  });

  it('prefixes at sign with single quote', () => {
    assert.strictEqual(sanitizeValue('@cmd'), "'@cmd");
  });

  it('does not prefix values without dangerous characters', () => {
    assert.strictEqual(sanitizeValue('hello'), 'hello');
    assert.strictEqual(sanitizeValue('vanilla'), 'vanilla');
    assert.strictEqual(sanitizeValue('42'), '42');
  });

  it('recursively sanitizes arrays', () => {
    const result = sanitizeValue(['=danger', 'safe', '+also-danger']);
    assert.deepStrictEqual(result, ["'=danger", 'safe', "'+also-danger"]);
  });

  it('passes through numbers unchanged', () => {
    assert.strictEqual(sanitizeValue(42), 42);
    assert.strictEqual(sanitizeValue(0), 0);
  });

  it('passes through booleans unchanged', () => {
    assert.strictEqual(sanitizeValue(true), true);
    assert.strictEqual(sanitizeValue(false), false);
  });
});
