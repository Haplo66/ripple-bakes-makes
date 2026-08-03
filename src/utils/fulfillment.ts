/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

const normalizeFulfillment = (value: string): string =>
  value.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Builds customer-friendly fulfillment copy from a sheet value.
 *
 * Accepts values such as "Pickup Only", "Shipping Available", or
 * "Pickup or Shipping". Returns null when the value is empty or not
 * recognized so callers can fall back to no fulfillment display.
 */
export const getFulfillmentText = (
  fulfillment?: string | null,
): string[] | null => {
  if (!fulfillment) return null;

  const key = normalizeFulfillment(fulfillment);

  if (key.includes('pickup') && key.includes('shipping')) {
    return [
      'Available for local pickup or shipping.',
      'Additional shipping charges may apply.',
    ];
  }

  if (key.includes('shipping')) {
    return [
      'Shipping available.',
      'Additional shipping charges may apply.',
    ];
  }

  if (key.includes('pickup')) {
    return ['Local pickup only.'];
  }

  return null;
};
