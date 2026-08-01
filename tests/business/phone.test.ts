/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isValidPhone } from '../../src/utils/phone.ts';

describe('isValidPhone', () => {
  it('accepts US format with dashes', () => {
    assert.strictEqual(isValidPhone('555-123-4567'), true);
  });

  it('accepts US format with parentheses and spaces', () => {
    assert.strictEqual(isValidPhone('(555) 123-4567'), true);
  });

  it('accepts international format with leading plus', () => {
    assert.strictEqual(isValidPhone('+1 555 123 4567'), true);
  });

  it('accepts numbers with dots', () => {
    assert.strictEqual(isValidPhone('555.123.4567'), true);
  });

  it('accepts a plain 10-digit number', () => {
    assert.strictEqual(isValidPhone('5551234567'), true);
  });

  it('accepts a 7-digit local number', () => {
    assert.strictEqual(isValidPhone('5551234'), true);
  });

  it('accepts a long international number up to 15 digits', () => {
    assert.strictEqual(isValidPhone('+44 20 7946 0958'), true);
  });

  it('rejects obviously invalid values with letters', () => {
    assert.strictEqual(isValidPhone('abc123'), false);
  });

  it('rejects too-short numeric values', () => {
    assert.strictEqual(isValidPhone('123'), false);
    assert.strictEqual(isValidPhone('12345'), false);
  });

  it('rejects values that are too long', () => {
    assert.strictEqual(isValidPhone('1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7'), false);
  });

  it('rejects an empty string', () => {
    assert.strictEqual(isValidPhone(''), false);
  });

  it('rejects whitespace-only values', () => {
    assert.strictEqual(isValidPhone('   '), false);
  });

  it('rejects non-string values', () => {
    assert.strictEqual(isValidPhone(5551234567), false);
    assert.strictEqual(isValidPhone(undefined), false);
    assert.strictEqual(isValidPhone(null), false);
  });

  it('rejects values containing disallowed characters', () => {
    assert.strictEqual(isValidPhone('555-123-4567!'), false);
    assert.strictEqual(isValidPhone('call me @ 555'), false);
  });

  it('trims surrounding whitespace before validating', () => {
    assert.strictEqual(isValidPhone('  555-123-4567  '), true);
  });
});
