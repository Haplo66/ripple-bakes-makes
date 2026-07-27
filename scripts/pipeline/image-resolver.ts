import { join } from 'node:path';
import { existsSync } from 'node:fs';
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

  if (productName) {
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
    candidates.push({
      path: join(IMAGE_DIR, 'collections', collectionName),
      folderKey: `collections/${collectionName}`,
    });
  }

  candidates.push({
    path: join(IMAGE_DIR, 'collections', collectionId),
    folderKey: `collections/${collectionId}`,
  });

  const resolvedAreaName = areaName || toBusinessAreaName(businessAreaId);
  const areaCode = toBusinessAreaCode(businessAreaId);

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
