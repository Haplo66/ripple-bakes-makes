/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isPlaceholderValue, validateFormField } from '../../src/utils/form-validation.ts';
import type { FormField } from '../../src/types/form.ts';

describe('isPlaceholderValue', () => {
  it('returns true for undefined', () => {
    assert.strictEqual(isPlaceholderValue(undefined), true);
  });

  it('returns true for empty string', () => {
    assert.strictEqual(isPlaceholderValue(''), true);
  });

  it('returns true for whitespace-only string', () => {
    assert.strictEqual(isPlaceholderValue('   '), true);
  });

  it('returns true for "Select one"', () => {
    assert.strictEqual(isPlaceholderValue('Select one'), true);
  });

  it('returns true for "Select..."', () => {
    assert.strictEqual(isPlaceholderValue('Select...'), true);
  });

  it('returns true for "Choose one"', () => {
    assert.strictEqual(isPlaceholderValue('Choose one'), true);
  });

  it('returns true for "Choose..."', () => {
    assert.strictEqual(isPlaceholderValue('Choose...'), true);
  });

  it('returns true for "Please select"', () => {
    assert.strictEqual(isPlaceholderValue('Please select'), true);
  });

  it('returns true for "Select another"', () => {
    assert.strictEqual(isPlaceholderValue('Select another'), true);
  });

  it('returns false for a real value', () => {
    assert.strictEqual(isPlaceholderValue('Red'), false);
  });

  it('returns false for a numeric value', () => {
    assert.strictEqual(isPlaceholderValue('42'), false);
  });
});

describe('validateFormField', () => {
  const baseField: FormField = {
    id: 'test',
    label: 'Test',
    type: 'toggle',
    required: true,
    options: [{ value: 'a', label: 'A' }],
  };

  it('returns false for required toggle with placeholder value', () => {
    const field = { ...baseField, type: 'toggle' as const };
    assert.strictEqual(validateFormField(field, 'Select one'), false);
  });

  it('returns true for required toggle with real value', () => {
    const field = { ...baseField, type: 'toggle' as const };
    assert.strictEqual(validateFormField(field, 'Red'), true);
  });

  it('returns true for optional toggle with placeholder value', () => {
    const field = { ...baseField, required: false, type: 'toggle' as const };
    assert.strictEqual(validateFormField(field, 'Select one'), true);
  });

  it('returns false for required checkbox with no value', () => {
    const field = { ...baseField, type: 'checkbox' as const, options: [{ value: 'agree', label: 'I agree' }] };
    assert.strictEqual(validateFormField(field, undefined), false);
  });

  it('returns false for required checkbox with empty array', () => {
    const field = { ...baseField, type: 'checkbox' as const, options: [{ value: 'agree', label: 'I agree' }] };
    assert.strictEqual(validateFormField(field, []), false);
  });

  it('returns true for required checkbox with checked value', () => {
    const field = { ...baseField, type: 'checkbox' as const, options: [{ value: 'agree', label: 'I agree' }] };
    assert.strictEqual(validateFormField(field, ['agree']), true);
  });

  it('returns true for optional checkbox with no value', () => {
    const field = { ...baseField, required: false, type: 'checkbox' as const, options: [{ value: 'agree', label: 'I agree' }] };
    assert.strictEqual(validateFormField(field, undefined), true);
  });

  it('returns true for toggle with more than 2 options', () => {
    const field = { ...baseField, type: 'toggle' as const, options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'maybe', label: 'Maybe' }] };
    assert.strictEqual(validateFormField(field, 'yes'), true);
  });

  it('returns true for toggle with exactly 2 options', () => {
    const field = { ...baseField, type: 'toggle' as const, options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] };
    assert.strictEqual(validateFormField(field, 'yes'), true);
  });

  it('returns true for text field with value', () => {
    const field = { ...baseField, type: 'text' as const, options: undefined };
    assert.strictEqual(validateFormField(field, 'some value'), true);
  });

  it('returns false for required text field with placeholder value', () => {
    const field = { ...baseField, type: 'text' as const, options: undefined };
    assert.strictEqual(validateFormField(field, 'Select one'), false);
  });
});