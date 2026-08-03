/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import type { FormField } from '../types/form';

const PLACEHOLDER_PATTERNS = [
  /^select one$/i,
  /^select\.\.\.$/i,
  /^choose one$/i,
  /^choose\.\.\.$/i,
  /^please select/i,
  /^select a?n?o?t?h?e?r?$/i,
];

export const isPlaceholderValue = (value: string | undefined): boolean => {
  if (!value || !value.trim()) return true;
  const trimmed = value.trim();
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
};

export const validateFormField = (
  field: FormField,
  value: string | string[] | undefined,
): boolean => {
  if (field.required && isPlaceholderValue(Array.isArray(value) ? value[0] : value)) {
    return false;
  }

  if (field.type === 'checkbox' && field.required && field.options) {
    if (!Array.isArray(value) || value.length === 0) return false;
  }

  return true;
};