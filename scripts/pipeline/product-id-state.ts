/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { dirname, join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { OUTPUT_DIR, OUTPUT_FILES, PRODUCT_ID_STATE_FILE } from './constants.ts';

/**
 * A product identity recorded in the pipeline's Product ID state.
 *
 * Product ID is a pipeline-generated technical identifier, so the mapping is
 * persisted locally (never in the human-facing spreadsheet). The `name`,
 * `businessArea`, and `collection` are the human-facing keys used to recognize
 * the same product across runs.
 */
export interface StoredProductId {
  id: string;
  businessArea: string;
  collection: string;
  name: string;
}

export interface ProductIdState {
  version: number;
  products: StoredProductId[];
}

export const PRODUCT_ID_STATE_VERSION = 1;

/**
 * Loads the pipeline's Product ID state. If no state file exists yet, it is
 * seeded from the last generated products.json so existing IDs are preserved
 * when the spreadsheet stops maintaining a Product ID column.
 */
export function loadProductIdState(
  filePath: string = PRODUCT_ID_STATE_FILE,
): ProductIdState {
  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as {
      version?: number;
      products?: StoredProductId[];
    };
    if (raw && Array.isArray(raw.products)) {
      return {
        version: raw.version ?? PRODUCT_ID_STATE_VERSION,
        products: raw.products,
      };
    }
  } catch {
    // No state yet — seed below.
  }

  return { version: PRODUCT_ID_STATE_VERSION, products: seedFromGeneratedProducts() };
}

function seedFromGeneratedProducts(): StoredProductId[] {
  try {
    const productsFile = join(OUTPUT_DIR, OUTPUT_FILES.products);
    const raw = JSON.parse(readFileSync(productsFile, 'utf-8')) as {
      data?: {
        id?: string;
        name?: string;
        businessArea?: string;
        collection?: string;
      }[];
    };

    return (raw.data ?? [])
      .filter(
        (p) =>
          typeof p.id === 'string' &&
          p.id.length > 0 &&
          typeof p.name === 'string' &&
          p.name.length > 0,
      )
      .map((p) => ({
        id: p.id!,
        businessArea: (p.businessArea ?? '').toLowerCase(),
        collection: p.collection ?? '',
        name: p.name!,
      }));
  } catch {
    return [];
  }
}

export function saveProductIdState(
  state: ProductIdState,
  filePath: string = PRODUCT_ID_STATE_FILE,
): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(
    filePath,
    `${JSON.stringify({ version: state.version, products: state.products }, null, 2)}\n`,
  );
}

export function buildProductIdState(
  products: { id: string; businessArea: string; collection: string; name: string }[],
): ProductIdState {
  return {
    version: PRODUCT_ID_STATE_VERSION,
    products: products.map((p) => ({
      id: p.id,
      businessArea: p.businessArea.toLowerCase(),
      collection: p.collection,
      name: p.name,
    })),
  };
}
