/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('RIPPLE Test Framework', () => {
  it('should execute a passing test with node:test', () => {
    assert.strictEqual(1 + 1, 2);
  });

  it('should support async test functions', async () => {
    const result = await Promise.resolve('framework-ready');
    assert.strictEqual(result, 'framework-ready');
  });

  it('should support TypeScript via --experimental-strip-types', () => {
    const message: string = 'typescript-works';
    assert.strictEqual(message, 'typescript-works');
  });
});
