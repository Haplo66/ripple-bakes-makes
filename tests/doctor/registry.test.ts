/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { registerChecks, getRegisteredChecks, clearChecks } from '../../scripts/doctor/registry.ts';
import type { DoctorCheck } from '../../scripts/doctor/types.ts';

const makeCheck = (id: string): DoctorCheck => ({
  id,
  category: 'Test',
  run: () => ({ id, category: 'Test', status: 'PASS' as const, summary: id }),
});

describe('registry', () => {
  after(() => {
    clearChecks();
  });

  it('registerChecks appends checks to the registry', () => {
    clearChecks();
    const check = makeCheck('test-001');
    registerChecks([check]);
    const registered = getRegisteredChecks();
    assert.strictEqual(registered.length, 1);
    assert.strictEqual(registered[0].id, 'test-001');
  });

  it('getRegisteredChecks returns a copy, not the internal array', () => {
    clearChecks();
    registerChecks([makeCheck('a')]);
    const first = getRegisteredChecks();
    const second = getRegisteredChecks();
    assert.notStrictEqual(first, second);
    assert.deepStrictEqual(first, second);
  });

  it('registerChecks appends to existing checks', () => {
    clearChecks();
    registerChecks([makeCheck('a')]);
    registerChecks([makeCheck('b')]);
    const registered = getRegisteredChecks();
    assert.strictEqual(registered.length, 2);
    assert.strictEqual(registered[0].id, 'a');
    assert.strictEqual(registered[1].id, 'b');
  });

  it('clearChecks removes all checks', () => {
    clearChecks();
    registerChecks([makeCheck('a')]);
    clearChecks();
    const registered = getRegisteredChecks();
    assert.strictEqual(registered.length, 0);
  });

  it('starts empty when no checks registered', () => {
    clearChecks();
    const registered = getRegisteredChecks();
    assert.strictEqual(registered.length, 0);
  });
});
