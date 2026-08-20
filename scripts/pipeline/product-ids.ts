/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import type { CsvRecord, PipelineWarning } from './types.ts';
import type { StoredProductId } from './product-id-state.ts';

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
 * Assigns Product IDs to product records. The spreadsheet carries no Product ID
 * column: IDs are reconciled from prior pipeline state (`priorProducts`).
 *
 * Reconciliation order for a record without an explicit ID:
 * 1. Exact match: a prior product with the same business area, collection, and
 *    name reuses its existing ID (a name change with the same collection and a
 *    1:1 swap reuses the ID too).
 * 2. Rename carry-over: if a collection has exactly one unmatched new record
 *    and exactly one unmatched prior product, the prior ID is reused.
 * 3. Otherwise the next available ID in the `{BA}-{Collection Code}-{NNN}`
 *    family is generated.
 *
 * Collection code resolution (in order):
 * 1. The collection's `code` field from the Collections sheet.
 * 2. Derived from an existing product ID in the same collection.
 * 3. Otherwise the row is left with a blank ID and a warning is emitted.
 *
 * Mutates `values.id` in place for rows it fills and returns the list of
 * assigned IDs (with sheet row numbers) for reporting.
 */
export function assignProductIds(
  records: CsvRecord[],
  collections: CollectionCodeRecord[],
  file: string,
  warnings: PipelineWarning[],
  priorProducts: StoredProductId[] = [],
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

  const matchedPriorIds = new Set<string>();
  for (const prior of priorProducts) {
    existingIds.add(prior.id);
  }

  const keyOf = (area: string, collection: string, name: string): string =>
    `${(area ?? '').trim().toLowerCase()}|${slugify(collection)}|${(name ?? '').trim()}`;

  const priorByKey = new Map<string, StoredProductId>();
  for (const prior of priorProducts) {
    const key = keyOf(prior.businessArea, prior.collection, prior.name);
    if (!priorByKey.has(key)) {
      priorByKey.set(key, prior);
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

  const assign = (record: CsvRecord, id: string): void => {
    record.values.id = id;
    existingIds.add(id);
    generated.push({ rowNumber: record.rowNumber, id });
  };

  // Pass 1: exact match on business area + collection + name.
  for (const record of records) {
    if (record.values.id?.trim()) continue;
    const key = keyOf(
      record.values.businessArea ?? '',
      record.values.collection ?? '',
      record.values.name ?? '',
    );
    const prior = priorByKey.get(key);
    if (prior && !matchedPriorIds.has(prior.id)) {
      assign(record, prior.id);
      matchedPriorIds.add(prior.id);
    }
  }

  // Pass 2: rename carry-over — one unmatched record and one unmatched prior
  // product in the same collection are treated as the same product renamed.
  const unmatchedByCollection = new Map<string, CsvRecord[]>();
  for (const record of records) {
    if (record.values.id?.trim()) continue;
    const collectionId = slugify(record.values.collection ?? '');
    const list = unmatchedByCollection.get(collectionId) ?? [];
    list.push(record);
    unmatchedByCollection.set(collectionId, list);
  }

  const unmatchedPriorByCollection = new Map<string, StoredProductId[]>();
  for (const prior of priorProducts) {
    if (matchedPriorIds.has(prior.id)) continue;
    const collectionId = slugify(prior.collection);
    const list = unmatchedPriorByCollection.get(collectionId) ?? [];
    list.push(prior);
    unmatchedPriorByCollection.set(collectionId, list);
  }

  for (const [collectionId, records2] of unmatchedByCollection) {
    const priors = unmatchedPriorByCollection.get(collectionId) ?? [];
    if (records2.length === 1 && priors.length === 1) {
      assign(records2[0], priors[0].id);
      matchedPriorIds.add(priors[0].id);
    }
  }

  // Pass 3: generate fresh IDs for anything still blank.
  for (const record of records) {
    if (record.values.id?.trim()) continue;

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

    assign(record, nextSequence(`${baCode}-${collectionCode}`));
  }

  return { generated };
}
