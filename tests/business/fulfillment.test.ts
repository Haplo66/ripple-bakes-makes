/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getFulfillmentText } from '../../src/utils/fulfillment.ts';

describe('getFulfillmentText', () => {
  it('returns pickup-only copy for "Pickup Only"', () => {
    assert.deepStrictEqual(getFulfillmentText('Pickup Only'), [
      'Local pickup only.',
    ]);
  });

  it('returns pickup-only copy for "Local Pickup"', () => {
    assert.deepStrictEqual(getFulfillmentText('Local Pickup'), [
      'Local pickup only.',
    ]);
  });

  it('returns shipping copy for "Shipping Available"', () => {
    assert.deepStrictEqual(getFulfillmentText('Shipping Available'), [
      'Shipping available.',
      'Additional shipping charges may apply.',
    ]);
  });

  it('returns shipping copy for a plain "Shipping" value', () => {
    assert.deepStrictEqual(getFulfillmentText('Shipping'), [
      'Shipping available.',
      'Additional shipping charges may apply.',
    ]);
  });

  it('returns pickup-or-shipping copy for "Pickup or Shipping"', () => {
    assert.deepStrictEqual(getFulfillmentText('Pickup or Shipping'), [
      'Available for local pickup or shipping.',
      'Additional shipping charges may apply.',
    ]);
  });

  it('is case insensitive', () => {
    assert.deepStrictEqual(getFulfillmentText('pickup only'), [
      'Local pickup only.',
    ]);
    assert.deepStrictEqual(getFulfillmentText('SHIPPING AVAILABLE'), [
      'Shipping available.',
      'Additional shipping charges may apply.',
    ]);
    assert.deepStrictEqual(getFulfillmentText('PICKUP OR SHIPPING'), [
      'Available for local pickup or shipping.',
      'Additional shipping charges may apply.',
    ]);
  });

  it('trims surrounding whitespace', () => {
    assert.deepStrictEqual(getFulfillmentText('  Pickup Only  '), [
      'Local pickup only.',
    ]);
  });

  it('returns null for undefined', () => {
    assert.strictEqual(getFulfillmentText(undefined), null);
  });

  it('returns null for null', () => {
    assert.strictEqual(getFulfillmentText(null), null);
  });

  it('returns null for empty string', () => {
    assert.strictEqual(getFulfillmentText(''), null);
  });

  it('returns null for whitespace-only string', () => {
    assert.strictEqual(getFulfillmentText('   '), null);
  });

  it('returns null for unrecognized values', () => {
    assert.strictEqual(getFulfillmentText('Delivery'), null);
    assert.strictEqual(getFulfillmentText('Meet at the shop'), null);
  });
});
