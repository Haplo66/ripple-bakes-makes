/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getPurchaseState } from '../../src/utils/purchase-state.ts';

describe('getPurchaseState', () => {
  it('returns purchasable when active and price is a valid number', () => {
    const result = getPurchaseState({ active: true, price: 45 });
    assert.strictEqual(result, 'purchasable');
  });

  it('returns purchasable when price is zero', () => {
    const result = getPurchaseState({ active: true, price: 0 });
    assert.strictEqual(result, 'purchasable');
  });

  it('returns coming-soon when active and price is null', () => {
    const result = getPurchaseState({ active: true, price: null });
    assert.strictEqual(result, 'coming-soon');
  });

  it('returns coming-soon when active and price is undefined', () => {
    const result = getPurchaseState({ active: true, price: undefined });
    assert.strictEqual(result, 'coming-soon');
  });

  it('returns coming-soon when active and price is NaN', () => {
    const result = getPurchaseState({ active: true, price: NaN });
    assert.strictEqual(result, 'coming-soon');
  });

  it('returns unavailable when inactive regardless of price', () => {
    assert.strictEqual(getPurchaseState({ active: false, price: 45 }), 'unavailable');
    assert.strictEqual(getPurchaseState({ active: false, price: null }), 'unavailable');
    assert.strictEqual(getPurchaseState({ active: false, price: undefined }), 'unavailable');
  });
});
