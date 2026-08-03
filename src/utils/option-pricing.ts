/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import type { ProductOptionValue } from '../types/cart';

const PRICE_ADJUSTMENT_SUFFIX_RE = /-(\d+)$/;

export const parseOptionValue = (rawValue: string): ProductOptionValue => {
  const match = rawValue.match(PRICE_ADJUSTMENT_SUFFIX_RE);

  if (match) {
    const adjustment = Number(match[1]);
    const cleanValue = rawValue.slice(0, match.index).replace(/-/g, ' ');

    return {
      value: cleanValue,
      priceAdjustment: Number.isFinite(adjustment) ? adjustment : 0,
    };
  }

  return {
    value: rawValue.replace(/-/g, ' '),
    priceAdjustment: 0,
  };
};

export const getOptionAdjustments = (
  configuration: Record<string, string | string[] | boolean | number | ProductOptionValue | ProductOptionValue[]>,
): number => {
  let total = 0;

  for (const value of Object.values(configuration)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'object' && item !== null && 'priceAdjustment' in item) {
          total += item.priceAdjustment;
        }
      }
    } else if (typeof value === 'object' && value !== null && 'priceAdjustment' in value) {
      total += value.priceAdjustment;
    }
  }

  return total;
};

export const formatOptionValue = (
  value: unknown,
): string => {
  if (typeof value === 'object' && value !== null && 'value' in value) {
    return String((value as ProductOptionValue).value);
  }

  if (Array.isArray(value)) {
    return value.map((v) => formatOptionValue(v)).join(', ');
  }

  return String(value);
};