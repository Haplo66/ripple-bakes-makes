/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const IMAGE_EXT = /\.(jpg|jpeg|png|webp)$/i;

/**
 * Removes local image files that no longer have a matching source image.
 *
 * Given a target asset folder and the set of image names currently present in
 * the source (e.g. Google Drive), this deletes any local image file whose name
 * is not in the keep-list. Non-image files, subfolders, and files in the
 * keep-list are left untouched so fallback/resolution behavior is preserved.
 *
 * @param targetDir  Absolute path to the local asset folder (e.g. public/images/products/...).
 * @param keepNames  Names of image files that still exist in the source and must be kept.
 * @param dryRun     When true, reports which files would be removed without deleting them.
 * @returns The list of removed (or would-be-removed) file names.
 */
export function removeStaleImages(
  targetDir: string,
  keepNames: string[],
  dryRun = false,
): string[] {
  if (!existsSync(targetDir)) return [];

  const keep = new Set(keepNames);
  const removed: string[] = [];

  const entries = readdirSync(targetDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!IMAGE_EXT.test(entry.name)) continue;
    if (keep.has(entry.name)) continue;

    if (!dryRun) {
      rmSync(join(targetDir, entry.name), { force: true });
    }
    removed.push(entry.name);
  }

  return removed;
}
