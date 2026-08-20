/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  buildProductIdState,
  loadProductIdState,
  saveProductIdState,
  PRODUCT_ID_STATE_VERSION,
} from '../../scripts/pipeline/product-id-state.ts';

let tempDir: string | undefined;

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe('buildProductIdState', () => {
  it('normalizes business area casing for stored products', () => {
    const state = buildProductIdState([
      { id: 'BK-SB-002', businessArea: 'Bakery', collection: 'sourdough-bread', name: 'Mix-Ins Sourdough Loaf' },
    ]);
    assert.strictEqual(state.version, PRODUCT_ID_STATE_VERSION);
    assert.deepStrictEqual(state.products, [
      { id: 'BK-SB-002', businessArea: 'bakery', collection: 'sourdough-bread', name: 'Mix-Ins Sourdough Loaf' },
    ]);
  });
});

describe('saveProductIdState / loadProductIdState', () => {
  it('round-trips a persisted state file', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'ripple-state-'));
    const file = join(tempDir, 'product-ids.json');
    const state = buildProductIdState([
      { id: 'SW-HS-001', businessArea: 'sewing', collection: 'bucket-hats', name: 'Bucket Hats' },
    ]);
    saveProductIdState(state, file);
    const loaded = loadProductIdState(file);
    assert.deepStrictEqual(loaded, state);
  });

  it('seeds an empty state for a missing file instead of throwing', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'ripple-state-'));
    const missing = join(tempDir, 'nope', 'product-ids.json');
    const loaded = loadProductIdState(missing);
    assert.ok(Array.isArray(loaded.products));
    assert.strictEqual(loaded.version, PRODUCT_ID_STATE_VERSION);
  });

  it('writes valid JSON with a trailing newline', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'ripple-state-'));
    const file = join(tempDir, 'product-ids.json');
    const state = buildProductIdState([
      { id: 'BK-SB-002', businessArea: 'bakery', collection: 'sourdough-bread', name: 'Mix-Ins Sourdough Loaf' },
    ]);
    saveProductIdState(state, file);
    const raw = readFileSync(file, 'utf-8');
    assert.ok(raw.endsWith('\n'));
    assert.ok(raw.includes('BK-SB-002'));
  });
});