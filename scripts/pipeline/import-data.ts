import { IMPORT_FILES, OUTPUT_FILES, PIPELINE_NAME, PIPELINE_VERSION } from './constants.ts';
import { readCsvFile } from './csv-reader.ts';
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

const warnings: PipelineWarning[] = [];
const generatedFiles: string[] = [];

const readValidRecords = (dataset: DatasetName) => {
  const fileName = IMPORT_FILES[dataset];
  logReadStart(fileName);
  const result = readCsvFile(fileName, warnings);

  return {
    found: result.found,
    records: validateRecords(dataset, fileName, result.records, warnings),
  };
};

logHeader(PIPELINE_NAME, PIPELINE_VERSION);

const collectionInput = readValidRecords('collections');
const collections = sortById(
  normalizeCollections(collectionInput.records, IMPORT_FILES.collections, warnings),
);
logDatasetResult('collections', collections.length);

const productInput = readValidRecords('products');
const products = sortById(normalizeProducts(productInput.records));
logDatasetResult('products', products.length);

const formInput = readValidRecords('forms');
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
