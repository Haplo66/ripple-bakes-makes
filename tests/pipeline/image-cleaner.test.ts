/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert';
import { existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { removeStaleImages } from '../../scripts/pipeline/image-cleaner.ts';

let dir: string;
const cleanup: string[] = [];

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ripple-image-cleaner-'));
  cleanup.push(dir);
});

after(() => {
  for (const d of cleanup) {
    rmSync(d, { recursive: true, force: true });
  }
});

function writeImage(name: string): void {
  writeFileSync(join(dir, name), 'fake-image-bytes');
}

function names(): string[] {
  return readdirSync(dir).sort();
}

describe('removeStaleImages', () => {
  it('removes local images that are no longer present in the source', () => {
    writeImage('gallery-01.jpg');
    writeImage('gallery-02.jpg');
    writeImage('gallery-03.jpg');

    const removed = removeStaleImages(dir, ['gallery-01.jpg', 'gallery-03.jpg']);

    assert.deepStrictEqual(removed.sort(), ['gallery-02.jpg']);
    assert.ok(!existsSync(join(dir, 'gallery-02.jpg')));
    assert.ok(existsSync(join(dir, 'gallery-01.jpg')));
    assert.ok(existsSync(join(dir, 'gallery-03.jpg')));
  });

  it('keeps every image that still exists in the source', () => {
    writeImage('main-01.jpg');
    writeImage('main-02.jpg');

    const removed = removeStaleImages(dir, ['main-01.jpg', 'main-02.jpg']);

    assert.deepStrictEqual(removed, []);
    assert.deepStrictEqual(names(), ['main-01.jpg', 'main-02.jpg']);
  });

  it('does not delete non-image files or subfolders', () => {
    writeImage('gallery-01.jpg');
    writeImage('notes.txt');
    mkdirSync(join(dir, 'sub'));

    const removed = removeStaleImages(dir, []);

    assert.deepStrictEqual(removed, ['gallery-01.jpg']);
    assert.ok(existsSync(join(dir, 'notes.txt')));
    assert.ok(existsSync(join(dir, 'sub')));
    assert.ok(!existsSync(join(dir, 'gallery-01.jpg')));
  });

  it('treats an empty source folder safely by clearing stale local images', () => {
    writeImage('gallery-01.jpg');
    writeImage('gallery-02.jpg');

    const removed = removeStaleImages(dir, []);

    assert.deepStrictEqual(removed.sort(), ['gallery-01.jpg', 'gallery-02.jpg']);
    assert.deepStrictEqual(names(), []);
  });

  it('is a no-op when the target folder does not exist', () => {
    const missing = join(dir, 'does-not-exist');
    const removed = removeStaleImages(missing, []);
    assert.deepStrictEqual(removed, []);
  });

  it('only reports, without deleting, when dryRun is set', () => {
    writeImage('gallery-01.jpg');
    writeImage('gallery-02.jpg');

    const removed = removeStaleImages(dir, ['gallery-01.jpg'], true);

    assert.deepStrictEqual(removed, ['gallery-02.jpg']);
    assert.ok(existsSync(join(dir, 'gallery-02.jpg')));
  });
});
