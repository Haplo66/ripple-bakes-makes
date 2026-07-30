/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sortById, createGeneratedJson } from '../../scripts/pipeline/generators.ts';

describe('sortById', () => {
  it('sorts records by id in localeCompare order', () => {
    const input = [{ id: 'z' }, { id: 'a' }, { id: 'm' }];
    const result = sortById(input);
    assert.deepStrictEqual(result, [{ id: 'a' }, { id: 'm' }, { id: 'z' }]);
  });

  it('returns a new array and does not mutate the original', () => {
    const input = [{ id: 'b' }, { id: 'a' }];
    const result = sortById(input as { id: string }[]);
    assert.notStrictEqual(result, input);
    assert.deepStrictEqual(input, [{ id: 'b' }, { id: 'a' }]);
  });

  it('handles empty array', () => {
    assert.deepStrictEqual(sortById([]), []);
  });

  it('handles single element', () => {
    assert.deepStrictEqual(sortById([{ id: 'only' }]), [{ id: 'only' }]);
  });
});

describe('createGeneratedJson', () => {
  it('wraps data in metadata envelope', () => {
    const data = [{ id: 'test' }];
    const result = createGeneratedJson(data);
    assert.strictEqual(result._metadata.generated, true);
    assert.strictEqual(result._metadata.source, 'RIPPLE Data Pipeline');
    assert.strictEqual(result._metadata.version, 1);
    assert.ok(typeof result._metadata.generatedAt === 'string');
    assert.ok(result._metadata.generatedAt.length > 0);
    assert.strictEqual(result.data, data);
  });

  it('handles empty data array', () => {
    const result = createGeneratedJson([]);
    assert.deepStrictEqual(result.data, []);
  });

  it('preserves data types through the envelope', () => {
    const data = [{ id: 'a', count: 42, active: true }, { id: 'b', tags: ['x'] }];
    const result = createGeneratedJson(data);
    assert.strictEqual(result.data.length, 2);
    assert.strictEqual(result.data[0].count, 42);
    assert.strictEqual(result.data[0].active, true);
    assert.deepStrictEqual(result.data[1].tags, ['x']);
  });
});
