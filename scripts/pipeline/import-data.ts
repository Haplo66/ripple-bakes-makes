import { existsSync, readdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { IMPORT_FILES, IMAGE_DIR, OUTPUT_FILES, PIPELINE_NAME, PIPELINE_VERSION } from './constants.ts';
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
  const normalizedProducts = normalizeProducts(productInput.records);

  const slugToCode: Record<string, string> = {};
  const codeToCollectionName: Record<string, string> = {};
  for (const record of normalizedProducts) {
    const code = record.id.replace(/-\d+$/, '');
    slugToCode[record.collection] = code;
  }
  for (const collection of collections) {
    const code = slugToCode[collection.id];
    if (code) {
      codeToCollectionName[code] = collection.name;
    }
  }

  const BUSINESS_AREA_NAMES: Record<string, string> = {
    bakery: 'Bakery',
    sewing: 'Sewing',
  };

  const products = sortById(
    normalizedProducts.map((record) => {
      const collectionId = record.id.replace(/-\d+$/, '');
      const productName = record.name;
      const collectionName = codeToCollectionName[collectionId];
      const areaName = BUSINESS_AREA_NAMES[record.businessArea] || record.businessArea;

      const resolved = resolveProductImages(
        record.id,
        collectionId,
        record.businessArea,
        warnings,
        { file: IMPORT_FILES.products },
        productName,
        collectionName,
        areaName,
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

  for (const collection of collections) {
    const code = slugToCode[collection.id];
    if (code) {
      const resolved = resolveCollectionImages(code, collection.name);
      if (resolved.imageFolder) {
        collection.imageFolder = resolved.imageFolder;
        collection.images = resolved.images;
        collection.heroImage = resolved.primaryImage || null;
      }
    }
  }

  const collectionIds = new Set(collections.map((c) => c.id));
  for (const product of products) {
    if (!collectionIds.has(product.collection)) {
      warnings.push({
        file: IMPORT_FILES.products,
        reason: `Product ${product.id} references unknown collection "${product.collection}"`,
      });
    }
  }

  const productCountByCollection = new Map<string, number>();
  for (const product of products) {
    productCountByCollection.set(
      product.collection,
      (productCountByCollection.get(product.collection) ?? 0) + 1,
    );
  }
  for (const collection of collections) {
    if ((productCountByCollection.get(collection.id) ?? 0) === 0) {
      warnings.push({
        file: IMPORT_FILES.collections,
        reason: `Collection "${collection.id}" contains no products.`,
      });
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

  const personalDir = join(IMAGE_DIR, 'gallery', 'personal');
  if (existsSync(personalDir)) {
    const ALLOWED = /\.(jpg|jpeg|png|webp)$/i;
    const files = readdirSync(personalDir)
      .filter((f) => ALLOWED.test(f))
      .sort();
    if (files.length > 0) {
      writeGeneratedJson(OUTPUT_FILES.galleryAssets, files);
      generatedFiles.push(OUTPUT_FILES.galleryAssets);
    }
  }

  logWarnings(warnings);
  logGenerated(generatedFiles);
  logSuccess();
};

await run();
