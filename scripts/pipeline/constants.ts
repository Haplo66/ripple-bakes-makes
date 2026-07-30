/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import path from 'node:path';

export const PIPELINE_NAME = 'RIPPLE Data Pipeline';
export const PIPELINE_VERSION = 1;

export const PROJECT_ROOT = process.cwd();
export const IMPORT_DIR = path.join(PROJECT_ROOT, 'data', 'import');
export const OUTPUT_DIR = path.join(PROJECT_ROOT, 'src', 'content');

export const IMPORT_FILES = {
  collections: 'collections.csv',
  products: 'products.csv',
  forms: 'forms.csv',
} as const;

export const OUTPUT_FILES = {
  collections: 'collections.json',
  products: 'products.json',
  forms: 'forms.json',
  galleryAssets: 'gallery-assets.json',
} as const;

export const IMAGE_DIR = path.join(PROJECT_ROOT, 'public', 'images');

export const MANIFEST_DIR = path.join(PROJECT_ROOT, 'data', 'manifest');
export const MANIFEST_FILE = path.join(MANIFEST_DIR, 'images.json');

export const SHEET_TABS = {
  collections: 'Collections',
  products: 'Products',
  forms: 'Forms',
} as const;

/** Canonical sheet tab name for owner-facing configuration (order workflows, business automation). */
export const ORDERS_CONFIG_TAB = 'Orders Config';
