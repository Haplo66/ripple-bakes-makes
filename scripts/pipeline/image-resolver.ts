import { join } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';
import { IMAGE_DIR } from './constants.ts';
import { scanImageFolder } from './image-scanner.ts';
import type { PipelineWarning } from './types.ts';

export interface ResolvedImages {
  images: string[];
  primaryImage: string;
  imageFolder: string;
}

const BUSINESS_AREA_CODES: Record<string, string> = {
  bakery: 'BK',
  sewing: 'SW',
  BK: 'BK',
  SW: 'SW',
};

const BUSINESS_AREA_NAMES: Record<string, string> = {
  bakery: 'Bakery',
  sewing: 'Sewing',
  BK: 'Bakery',
  SW: 'Sewing',
};

const toBusinessAreaCode = (area: string): string =>
  BUSINESS_AREA_CODES[area] ?? area;

const toBusinessAreaName = (area: string): string =>
  BUSINESS_AREA_NAMES[area] ?? area;

function resolveFolderByPriority(
  candidates: { path: string; folderKey: string }[],
  warnings: PipelineWarning[],
  context: { file: string; productId?: string },
): ResolvedImages {
  for (const { path, folderKey } of candidates) {
    if (existsSync(path)) {
      const result = scanImageFolder(path);
      if (result.found) {
        return {
          images: result.files,
          primaryImage: result.files[0],
          imageFolder: folderKey,
        };
      }
    }
  }

  if (context.productId) {
    warnings.push({
      file: context.file,
      reason: `Product ${context.productId} is using default image.`,
    });
  }

  return { images: [], primaryImage: '', imageFolder: '' };
}

export function resolveProductImages(
  productId: string,
  collectionId: string,
  businessAreaId: string,
  warnings: PipelineWarning[],
  context: { file: string },
  productName?: string,
  collectionName?: string,
  areaName?: string,
): ResolvedImages {
  const candidates: { path: string; folderKey: string }[] = [];

  const resolvedAreaName = areaName || toBusinessAreaName(businessAreaId);
  const areaCode = toBusinessAreaCode(businessAreaId);

  if (productName && resolvedAreaName) {
    const baDir = join(IMAGE_DIR, 'products', resolvedAreaName);
    if (existsSync(baDir)) {
      for (const entry of readdirSync(baDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const subPath = join(baDir, entry.name, productName);
        if (existsSync(subPath)) {
          const result = scanImageFolder(subPath);
          if (result.found) {
            return {
              images: result.files,
              primaryImage: result.files[0],
              imageFolder: `products/${resolvedAreaName}/${entry.name}/${productName}`,
            };
          }
        }
      }
    }
  }

  if (productName) {
    candidates.push({
      path: join(IMAGE_DIR, 'products', resolvedAreaName, productName),
      folderKey: `products/${resolvedAreaName}/${productName}`,
    });
    candidates.push({
      path: join(IMAGE_DIR, 'products', areaCode, productName),
      folderKey: `products/${areaCode}/${productName}`,
    });
    candidates.push({
      path: join(IMAGE_DIR, 'products', productName),
      folderKey: `products/${productName}`,
    });
  }

  candidates.push({
    path: join(IMAGE_DIR, 'products', productId),
    folderKey: `products/${productId}`,
  });

  if (collectionName) {
    const collectionsDir = join(IMAGE_DIR, 'collections');
    if (existsSync(collectionsDir)) {
      for (const entry of readdirSync(collectionsDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const subPath = join(collectionsDir, entry.name, collectionName);
        if (existsSync(subPath)) {
          candidates.push({
            path: subPath,
            folderKey: `collections/${entry.name}/${collectionName}`,
          });
        }
      }
    }
    candidates.push({
      path: join(IMAGE_DIR, 'collections', collectionName),
      folderKey: `collections/${collectionName}`,
    });
  }

  candidates.push({
    path: join(IMAGE_DIR, 'collections', collectionId),
    folderKey: `collections/${collectionId}`,
  });

  candidates.push({
    path: join(IMAGE_DIR, 'business-areas', resolvedAreaName),
    folderKey: `business-areas/${resolvedAreaName}`,
  });

  candidates.push({
    path: join(IMAGE_DIR, 'business-areas', areaCode),
    folderKey: `business-areas/${areaCode}`,
  });

  return resolveFolderByPriority(candidates, warnings, {
    file: context.file,
    productId,
  });
}

export function resolveCollectionImages(
  collectionCode: string,
  collectionName?: string,
): { images: string[]; primaryImage: string; imageFolder: string } {
  const candidates: { path: string; folderKey: string }[] = [];

  // Check BA subfolder paths first: collections/{BA}/{collectionName}/
  if (collectionName) {
    const collectionsDir = join(IMAGE_DIR, 'collections');
    if (existsSync(collectionsDir)) {
      for (const entry of readdirSync(collectionsDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const subPath = join(collectionsDir, entry.name, collectionName);
        if (existsSync(subPath)) {
          candidates.push({
            path: subPath,
            folderKey: `collections/${entry.name}/${collectionName}`,
          });
        }
      }
    }
  }

  if (collectionName) {
    candidates.push({
      path: join(IMAGE_DIR, 'collections', collectionName),
      folderKey: `collections/${collectionName}`,
    });
  }

  candidates.push({
    path: join(IMAGE_DIR, 'collections', collectionCode),
    folderKey: `collections/${collectionCode}`,
  });

  for (const { path, folderKey } of candidates) {
    if (existsSync(path)) {
      const result = scanImageFolder(path);
      if (result.found) {
        return {
          images: result.files,
          primaryImage: result.files[0],
          imageFolder: folderKey,
        };
      }
    }
  }

  return { images: [], primaryImage: '', imageFolder: '' };
}
