import path from 'node:path';

export const PIPELINE_NAME = 'Honeycomb Data Pipeline';
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
} as const;

export const SHEET_TABS = {
  collections: 'Collections',
  products: 'Products',
  forms: 'Forms',
} as const;
