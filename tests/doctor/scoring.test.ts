/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateScore, getStatus, collectRecommendations, buildHealthScore } from '../../scripts/doctor/scoring.ts';
import { buildSummary } from '../../scripts/doctor/doctor.ts';
import type { DoctorResult } from '../../scripts/doctor/types.ts';

const pass = (): DoctorResult => ({ id: 'p1', category: 'Test', status: 'PASS', summary: 'ok' });
const warn = (rec?: string): DoctorResult => ({ id: 'w1', category: 'Test', status: 'WARN', summary: 'warn', ...(rec ? { recommendation: rec } : {}) });
const fail = (rec?: string): DoctorResult => ({ id: 'f1', category: 'Test', status: 'FAIL', summary: 'fail', ...(rec ? { recommendation: rec } : {}) });
const info = (): DoctorResult => ({ id: 'i1', category: 'Test', status: 'INFO', summary: 'info' });

describe('calculateScore', () => {
  it('starts at 100 with no results', () => {
    assert.strictEqual(calculateScore([]), 100);
  });

  it('starts at 100 with only PASS results', () => {
    assert.strictEqual(calculateScore([pass()]), 100);
  });

  it('deducts 5 for each WARN', () => {
    assert.strictEqual(calculateScore([warn()]), 95);
    assert.strictEqual(calculateScore([warn(), warn()]), 90);
  });

  it('deducts 15 for each FAIL', () => {
    assert.strictEqual(calculateScore([fail()]), 85);
    assert.strictEqual(calculateScore([fail(), fail()]), 70);
  });

  it('deducts correctly for mixed WARN and FAIL', () => {
    assert.strictEqual(calculateScore([warn(), fail()]), 80);
    assert.strictEqual(calculateScore([warn(), warn(), fail()]), 75);
  });

  it('does not deduct for PASS or INFO', () => {
    assert.strictEqual(calculateScore([pass(), info()]), 100);
  });

  it('floors score at 0', () => {
    assert.strictEqual(calculateScore(Array.from({ length: 10 }, () => fail())), 0);
    assert.strictEqual(calculateScore(Array.from({ length: 30 }, () => warn())), 0);
  });
});

describe('getStatus', () => {
  it('returns GOOD for score >= 90', () => {
    assert.strictEqual(getStatus(100), 'GOOD');
    assert.strictEqual(getStatus(90), 'GOOD');
  });

  it('returns ATTENTION for score >= 70 and < 90', () => {
    assert.strictEqual(getStatus(89), 'ATTENTION');
    assert.strictEqual(getStatus(70), 'ATTENTION');
  });

  it('returns CRITICAL for score < 70', () => {
    assert.strictEqual(getStatus(69), 'CRITICAL');
    assert.strictEqual(getStatus(0), 'CRITICAL');
  });
});

describe('collectRecommendations', () => {
  it('returns empty array when no WARN or FAIL results', () => {
    const results = [pass(), info()];
    assert.deepStrictEqual(collectRecommendations(results), []);
  });

  it('returns empty array when WARN/FAIL have no recommendations', () => {
    const results = [warn(), fail()];
    assert.deepStrictEqual(collectRecommendations(results), []);
  });

  it('includes recommendations from WARN results', () => {
    const results = [warn('Fix something')];
    const recs = collectRecommendations(results);
    assert.strictEqual(recs.length, 1);
    assert.strictEqual(recs[0].id, 'w1');
    assert.strictEqual(recs[0].text, 'Fix something');
  });

  it('includes recommendations from FAIL results', () => {
    const results = [fail('Fix urgently')];
    const recs = collectRecommendations(results);
    assert.strictEqual(recs.length, 1);
    assert.strictEqual(recs[0].text, 'Fix urgently');
  });

  it('deduplicates recommendations with the same text case-insensitively', () => {
    const results = [warn('Fix this'), fail('Fix this'), warn('FIX THIS')];
    const recs = collectRecommendations(results);
    assert.strictEqual(recs.length, 1);
    assert.strictEqual(recs[0].text, 'Fix this');
  });

  it('deduplicates ignoring leading and trailing whitespace', () => {
    const results = [warn('Fix this'), fail('  Fix this  ')];
    const recs = collectRecommendations(results);
    assert.strictEqual(recs.length, 1);
  });

  it('keeps unique recommendations from different results', () => {
    const results = [warn('Fix A'), fail('Fix B')];
    const recs = collectRecommendations(results);
    assert.strictEqual(recs.length, 2);
  });
});

describe('buildHealthScore', () => {
  it('returns 100 and GOOD for empty results', () => {
    const hs = buildHealthScore([]);
    assert.strictEqual(hs.score, 100);
    assert.strictEqual(hs.maxScore, 100);
    assert.strictEqual(hs.status, 'GOOD');
    assert.deepStrictEqual(hs.recommendations, []);
  });

  it('returns correct score and status for mixed results', () => {
    const results = [warn('Fix A'), fail('Fix B')];
    const hs = buildHealthScore(results);
    assert.strictEqual(hs.score, 80);
    assert.strictEqual(hs.status, 'ATTENTION');
    assert.strictEqual(hs.recommendations.length, 2);
  });

  it('includes recommendations in the response', () => {
    const results = [warn('Improve images')];
    const hs = buildHealthScore(results);
    assert.strictEqual(hs.recommendations.length, 1);
    assert.strictEqual(hs.recommendations[0].text, 'Improve images');
  });

  it('all PASS results yields full score', () => {
    const results = [pass(), pass(), pass()];
    const hs = buildHealthScore(results);
    assert.strictEqual(hs.score, 100);
    assert.strictEqual(hs.status, 'GOOD');
  });
});

describe('buildSummary', () => {
  it('counts PASS results correctly', () => {
    const results = [pass(), pass(), pass()];
    const s = buildSummary(results);
    assert.strictEqual(s.total, 3);
    assert.strictEqual(s.pass, 3);
    assert.strictEqual(s.warn, 0);
    assert.strictEqual(s.fail, 0);
    assert.strictEqual(s.info, 0);
  });

  it('counts all statuses correctly', () => {
    const results = [pass(), warn(), fail(), info()];
    const s = buildSummary(results);
    assert.strictEqual(s.total, 4);
    assert.strictEqual(s.pass, 1);
    assert.strictEqual(s.warn, 1);
    assert.strictEqual(s.fail, 1);
    assert.strictEqual(s.info, 1);
  });

  it('returns zeros for empty results', () => {
    const s = buildSummary([]);
    assert.strictEqual(s.total, 0);
    assert.strictEqual(s.pass, 0);
    assert.strictEqual(s.warn, 0);
    assert.strictEqual(s.fail, 0);
    assert.strictEqual(s.info, 0);
  });

  it('handles multiple results of the same status', () => {
    const results = [pass(), pass(), warn(), warn(), fail()];
    const s = buildSummary(results);
    assert.strictEqual(s.total, 5);
    assert.strictEqual(s.pass, 2);
    assert.strictEqual(s.warn, 2);
    assert.strictEqual(s.fail, 1);
    assert.strictEqual(s.info, 0);
  });

  it('total equals pass + warn + fail + info', () => {
    const results = [pass(), pass(), warn(), fail(), info(), info()];
    const s = buildSummary(results);
    assert.strictEqual(s.total, s.pass + s.warn + s.fail + s.info);
  });
});
