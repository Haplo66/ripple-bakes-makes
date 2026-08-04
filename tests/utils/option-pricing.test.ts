/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseOptionValue, getOptionAdjustments, formatOptionValue } from '../../src/utils/option-pricing.ts';

describe('parseOptionValue', () => {
  it('extracts price adjustment from value with -- price suffix', () => {
    const result = parseOptionValue('60-pieces--20');
    assert.strictEqual(result.value, '60 pieces');
    assert.strictEqual(result.priceAdjustment, 20);
  });

  it('returns zero adjustment for value without numeric suffix', () => {
    const result = parseOptionValue('30-pieces');
    assert.strictEqual(result.value, '30 pieces');
    assert.strictEqual(result.priceAdjustment, 0);
  });

  it('handles single-word values without hyphens', () => {
    const result = parseOptionValue('vanilla');
    assert.strictEqual(result.value, 'vanilla');
    assert.strictEqual(result.priceAdjustment, 0);
  });

  it('handles values with multiple hyphens and a -- price suffix', () => {
    const result = parseOptionValue('large-red--10');
    assert.strictEqual(result.value, 'large red');
    assert.strictEqual(result.priceAdjustment, 10);
  });

  it('treats a single-dash numeric suffix as part of the value', () => {
    const result = parseOptionValue('large-red-10');
    assert.strictEqual(result.value, 'large red 10');
    assert.strictEqual(result.priceAdjustment, 0);
  });

  it('handles values where the suffix is not a number', () => {
    const result = parseOptionValue('small-cup');
    assert.strictEqual(result.value, 'small cup');
    assert.strictEqual(result.priceAdjustment, 0);
  });

  it('treats free toggle options ending in a number as zero adjustment', () => {
    const result = parseOptionValue('test-1');
    assert.strictEqual(result.value, 'test 1');
    assert.strictEqual(result.priceAdjustment, 0);
  });

  it('treats free toggle options ending in 2 and 3 as zero adjustment', () => {
    assert.strictEqual(parseOptionValue('test-2').priceAdjustment, 0);
    assert.strictEqual(parseOptionValue('test-3').priceAdjustment, 0);
  });

  it('extracts price from a priced option whose base ends in a number', () => {
    const result = parseOptionValue('test-2--10');
    assert.strictEqual(result.value, 'test 2');
    assert.strictEqual(result.priceAdjustment, 10);
  });

  it('handles empty string', () => {
    const result = parseOptionValue('');
    assert.strictEqual(result.value, '');
    assert.strictEqual(result.priceAdjustment, 0);
  });
});

describe('getOptionAdjustments', () => {
  it('sums price adjustments from structured option values', () => {
    const configuration = {
      size: { value: '60 pieces', priceAdjustment: 20 },
    };
    assert.strictEqual(getOptionAdjustments(configuration), 20);
  });

  it('returns zero when configuration has no structured option values', () => {
    const configuration = { flavor: 'vanilla' };
    assert.strictEqual(getOptionAdjustments(configuration), 0);
  });

  it('handles multiple structured option values', () => {
    const configuration = {
      size: { value: '60 pieces', priceAdjustment: 20 },
      color: { value: 'red', priceAdjustment: 5 },
    };
    assert.strictEqual(getOptionAdjustments(configuration), 25);
  });

  it('handles arrays of structured option values', () => {
    const configuration = {
      toppings: [
        { value: 'cheese', priceAdjustment: 3 },
        { value: 'pepperoni', priceAdjustment: 5 },
      ],
    };
    assert.strictEqual(getOptionAdjustments(configuration), 8);
  });

  it('ignores non-structured values in arrays', () => {
    const configuration = {
      tags: ['small', { value: 'large', priceAdjustment: 10 }],
    };
    assert.strictEqual(getOptionAdjustments(configuration), 10);
  });

  it('returns zero for empty configuration', () => {
    assert.strictEqual(getOptionAdjustments({}), 0);
  });
});

describe('formatOptionValue', () => {
  it('returns the clean value for structured option values with no adjustment', () => {
    assert.strictEqual(formatOptionValue({ value: 'White', priceAdjustment: 0 }), 'White');
  });

  it('returns the value with positive adjustment inline', () => {
    assert.strictEqual(formatOptionValue({ value: 'Yes', priceAdjustment: 15 }), 'Yes (+$15)');
  });

  it('returns the value with negative adjustment inline', () => {
    assert.strictEqual(formatOptionValue({ value: 'Cotton', priceAdjustment: -5 }), 'Cotton (-$5)');
  });

  it('returns the string for plain string values', () => {
    assert.strictEqual(formatOptionValue('vanilla'), 'vanilla');
  });

  it('joins array values with commas', () => {
    assert.strictEqual(formatOptionValue(['vanilla', 'chocolate']), 'vanilla, chocolate');
  });

  it('handles arrays with structured values', () => {
    assert.strictEqual(
      formatOptionValue([{ value: '60 pieces', priceAdjustment: 20 }, 'cheese']),
      '60 pieces (+$20), cheese',
    );
  });

  it('returns empty string for empty array', () => {
    assert.strictEqual(formatOptionValue([]), '');
  });

  it('handles boolean values', () => {
    assert.strictEqual(formatOptionValue(true), 'true');
  });

  it('handles number values', () => {
    assert.strictEqual(formatOptionValue(42), '42');
  });
});