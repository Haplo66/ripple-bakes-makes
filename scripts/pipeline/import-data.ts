import { IMPORT_FILES, OUTPUT_FILES, PIPELINE_NAME, PIPELINE_VERSION } from './constants.ts';
import { sortById, writeGeneratedJson } from './generators.ts';
import {
  logDatasetResult,
  logGenerated,
  logHeader,
  logReadStart,
  logSuccess,
  logWarnings,
} from './logger.ts';
import {
  normalizeCollections,
  normalizeForms,
  normalizeProducts,
} from './normalizers.ts';
import type { DatasetName, PipelineWarning } from './types.ts';
import { validateRecords } from './validators.ts';
import { createReader } from './reader.ts';

const warnings: PipelineWarning[] = [];
const generatedFiles: string[] = [];

const reader = createReader();

const readValidRecords = async (dataset: DatasetName) => {
  const label = process.env.SHEETS_ENABLED === 'true' ? `Google Sheets: ${dataset}` : IMPORT_FILES[dataset];
  logReadStart(label);
  const result = await reader.read(dataset, warnings);

  return {
    found: result.found,
    records: validateRecords(dataset, label, result.records, warnings),
  };
};

const run = async (): Promise<void> => {
  logHeader(PIPELINE_NAME, PIPELINE_VERSION);

  const collectionInput = await readValidRecords('collections');
  const collections = sortById(
    normalizeCollections(collectionInput.records, IMPORT_FILES.collections, warnings),
  );
  logDatasetResult('collections', collections.length);

  const productInput = await readValidRecords('products');
  const products = sortById(normalizeProducts(productInput.records));
  logDatasetResult('products', products.length);

  const formInput = await readValidRecords('forms');
  const forms = sortById(
    normalizeForms(formInput.records, IMPORT_FILES.forms, warnings),
  );
  logDatasetResult('forms', forms.length);

  if (collectionInput.found) {
    writeGeneratedJson(OUTPUT_FILES.collections, collections);
    generatedFiles.push(OUTPUT_FILES.collections);
  }

  if (productInput.found) {
    writeGeneratedJson(OUTPUT_FILES.products, products);
    generatedFiles.push(OUTPUT_FILES.products);
  }

  if (formInput.found) {
    writeGeneratedJson(OUTPUT_FILES.forms, forms);
    generatedFiles.push(OUTPUT_FILES.forms);
  }

  logWarnings(warnings);
  logGenerated(generatedFiles);
  logSuccess();
};

await run();
