/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import type { CsvRecord, PipelineWarning } from './types.ts';

/** Business Area → 2-letter prefix used in Product IDs (e.g. `BK-CH-001`). */
export const BUSINESS_AREA_CODES: Record<string, string> = {
  bakery: 'BK',
  sewing: 'SW',
  BK: 'BK',
  SW: 'SW',
};

/** Canonical Product ID shape: `{BA}-{Collection Code}-{NNN}`. */
export const PRODUCT_ID_PATTERN = /^[A-Z]{2}-[A-Z]{2}-\d{3}$/;

/** A Product ID that was generated for a single row (used for Sheets write-back). */
export interface GeneratedProductId {
  rowNumber: number;
  id: string;
}

/** Minimal collection shape needed for code lookup. */
export interface CollectionCodeRecord {
  id: string;
  code?: string;
}

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Fills blank Product IDs with the next available ID in the `{BA}-{Collection Code}-{NNN}`
 * family. Existing Product IDs are never modified and never reused.
 *
 * Collection code resolution (in order):
 * 1. The collection's `code` field from the Collections sheet.
 * 2. Derived from an existing product ID in the same collection.
 * 3. Otherwise the row is left with a blank ID and a warning is emitted.
 *
 * Mutates `values.id` in place for rows it fills and returns the list of
 * generated IDs (with sheet row numbers) for write-back.
 */
export function assignProductIds(
  records: CsvRecord[],
  collections: CollectionCodeRecord[],
  file: string,
  warnings: PipelineWarning[],
): { generated: GeneratedProductId[] } {
  const codeByCollection = new Map<string, string>();
  for (const collection of collections) {
    const code = collection.code?.trim().toUpperCase();
    if (code) {
      codeByCollection.set(collection.id, code);
    }
  }

  const existingIds = new Set<string>();
  const codeByProductCollection = new Map<string, string>();
  for (const record of records) {
    const id = record.values.id?.trim();
    if (id) {
      existingIds.add(id);
    }
    if (PRODUCT_ID_PATTERN.test(id)) {
      const collectionId = slugify(record.values.collection ?? '');
      const prefix = id.replace(/-\d{3}$/, '');
      if (!codeByProductCollection.has(collectionId)) {
        codeByProductCollection.set(collectionId, prefix);
      }
    }
  }

  const nextSequence = (prefix: string): string => {
    let max = 0;
    for (const id of existingIds) {
      const match = id.match(/^([A-Z]{2}-[A-Z]{2})-(\d{3})$/);
      if (match && match[1] === prefix) {
        max = Math.max(max, Number(match[2]));
      }
    }
    return `${prefix}-${String(max + 1).padStart(3, '0')}`;
  };

  const generated: GeneratedProductId[] = [];

  for (const record of records) {
    if (record.values.id?.trim()) {
      continue;
    }

    const rawArea = (record.values.businessArea ?? '').trim();
    const baCode = BUSINESS_AREA_CODES[rawArea] || BUSINESS_AREA_CODES[rawArea.toLowerCase()];
    if (!baCode) {
      warnings.push({
        file,
        rowNumber: record.rowNumber,
        column: 'businessArea',
        reason: 'Cannot auto-generate Product ID: unknown Business Area.',
      });
      continue;
    }

    const collectionId = slugify(record.values.collection ?? '');
    if (!collectionId) {
      warnings.push({
        file,
        rowNumber: record.rowNumber,
        column: 'collection',
        reason: 'Cannot auto-generate Product ID: missing collection.',
      });
      continue;
    }

    let collectionCode = codeByCollection.get(collectionId);
    if (!collectionCode) {
      const derived = codeByProductCollection.get(collectionId);
      if (derived) {
        collectionCode = derived.replace(new RegExp(`^${baCode}-`), '');
      }
    }
    if (!collectionCode) {
      warnings.push({
        file,
        rowNumber: record.rowNumber,
        column: 'id',
        reason: `Cannot auto-generate Product ID: collection "${collectionId}" has no code and no existing product ID to derive from.`,
      });
      continue;
    }

    const id = nextSequence(`${baCode}-${collectionCode}`);
    record.values.id = id;
    existingIds.add(id);
    generated.push({ rowNumber: record.rowNumber, id });
  }

  return { generated };
}
