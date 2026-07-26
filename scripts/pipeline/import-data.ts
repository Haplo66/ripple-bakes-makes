import { IMPORT_FILES, OUTPUT_FILES, PIPELINE_NAME, PIPELINE_VERSION } from './constants.ts';
import { sortById, writeGeneratedJson } from './generators.ts';
import { resolveCollectionImages, resolveProductImages } from './image-resolver.ts';
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
  const products = sortById(
    normalizeProducts(productInput.records).map((record) => {
      const collectionId = record.id.replace(/-\d+$/, '');
      const resolved = resolveProductImages(
        record.id,
        collectionId,
        record.businessArea,
        warnings,
        { file: IMPORT_FILES.products },
      );

      return {
        ...record,
        imageFolder: resolved.imageFolder,
        images: resolved.images,
        image: resolved.primaryImage || null,
        primaryImage: resolved.primaryImage,
      };
    }),
  );
  logDatasetResult('products', products.length);

  const slugToCode: Record<string, string> = {};
  for (const record of normalizeProducts(productInput.records)) {
    slugToCode[record.collection] = record.id.replace(/-\d+$/, '');
  }

  for (const collection of collections) {
    const code = slugToCode[collection.id];
    if (code) {
      const resolved = resolveCollectionImages(code);
      if (resolved.imageFolder) {
        collection.imageFolder = resolved.imageFolder;
        collection.images = resolved.images;
        collection.heroImage = resolved.primaryImage || null;
      }
    }
  }

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
