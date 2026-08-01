/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

/** Formats a validation message for an invalid phone value. */
export const PHONE_VALIDATION_MESSAGE =
  'Please enter a valid phone number, e.g. 555-123-4567 or +1 555 123 4567.';

/** Matches a phone value composed only of digits and common formatting characters. */
const PHONE_CHARS_PATTERN = /^\+?[\d\s().-]+$/;

/**
 * Validates that a value looks like a usable phone number.
 *
 * Empty values are considered invalid so callers can decide whether the field
 * is required. International numbers are supported (E.164 allows up to 15
 * digits). Formatting characters such as spaces, dashes, parentheses, and dots
 * are allowed.
 */
export const isValidPhone = (value: unknown): boolean => {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();

  if (trimmed === '') {
    return false;
  }

  if (!PHONE_CHARS_PATTERN.test(trimmed)) {
    return false;
  }

  const digits = trimmed.replace(/\D/g, '');

  return digits.length >= 7 && digits.length <= 15;
};
