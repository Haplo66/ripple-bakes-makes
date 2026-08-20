/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { join } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';
import { IMAGE_DIR } from './constants.ts';
import { normalizeFolderName } from './product-folder-classifier.ts';
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

function findInBusinessArea(
  imageRoot: string,
  areaName: string,
  folderName: string,
): ResolvedImages | undefined {
  const baDir = join(imageRoot, 'products', areaName);
  if (!existsSync(baDir)) return undefined;

  const wanted = normalizeFolderName(folderName);
  for (const entry of readdirSync(baDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const exactPath = join(baDir, entry.name, folderName);
    const exactResult = existsSync(exactPath) ? scanImageFolder(exactPath) : undefined;
    if (exactResult?.found) {
      return {
        images: exactResult.files,
        primaryImage: exactResult.files[0],
        imageFolder: `products/${areaName}/${entry.name}/${folderName}`,
      };
    }

    const collectionDir = join(baDir, entry.name);
    for (const sub of readdirSync(collectionDir, { withFileTypes: true })) {
      if (!sub.isDirectory()) continue;
      if (normalizeFolderName(sub.name) !== wanted) continue;
      const result = scanImageFolder(join(collectionDir, sub.name));
      if (result.found) {
        return {
          images: result.files,
          primaryImage: result.files[0],
          imageFolder: `products/${areaName}/${entry.name}/${sub.name}`,
        };
      }
    }
  }
  return undefined;
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
  manifestFolder?: string,
  imageRoot: string = IMAGE_DIR,
): ResolvedImages {
  const candidates: { path: string; folderKey: string }[] = [];

  const resolvedAreaName = areaName || toBusinessAreaName(businessAreaId);
  const areaCode = toBusinessAreaCode(businessAreaId);

  if (productName && resolvedAreaName) {
    const baDir = join(imageRoot, 'products', resolvedAreaName);
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

  // Manifest association: renamed products keep their historical Drive folder
  // name (captured in the manifest), which no longer matches the product name.
  if (manifestFolder && manifestFolder !== productName && resolvedAreaName) {
    const hit = findInBusinessArea(imageRoot, resolvedAreaName, manifestFolder);
    if (hit) return hit;
  }

  // Forgiving singular/plural matching ("Bucket Hat" vs "Bucket Hats").
  const normalizedProductName = productName ? normalizeFolderName(productName) : '';
  if (normalizedProductName && normalizedProductName !== normalizeFolderName(manifestFolder ?? '') && resolvedAreaName) {
    const hit = findInBusinessArea(imageRoot, resolvedAreaName, normalizedProductName);
    if (hit) return hit;
  }

  if (productName) {
    candidates.push({
      path: join(imageRoot, 'products', productName),
      folderKey: `products/${productName}`,
    });
  }

  const areaCandidates: string[] = [resolvedAreaName];
  if (areaCode !== resolvedAreaName) {
    areaCandidates.push(areaCode);
  }
  for (const area of areaCandidates) {
    if (productName) {
      candidates.push({
        path: join(imageRoot, 'products', area, productName),
        folderKey: `products/${area}/${productName}`,
      });
    }
    if (collectionName) {
      const collectionsDir = join(imageRoot, 'collections');
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
        path: join(imageRoot, 'collections', area, collectionName),
        folderKey: `collections/${area}/${collectionName}`,
      });
      candidates.push({
        path: join(imageRoot, 'collections', collectionName),
        folderKey: `collections/${collectionName}`,
      });
    }
    candidates.push({
      path: join(imageRoot, 'business-areas', area),
      folderKey: `business-areas/${area}`,
    });
  }

  candidates.push({
    path: join(imageRoot, 'products', productId),
    folderKey: `products/${productId}`,
  });
  candidates.push({
    path: join(imageRoot, 'collections', collectionId),
    folderKey: `collections/${collectionId}`,
  });

  return resolveFolderByPriority(candidates, warnings, {
    file: context.file,
    productId,
  });
}

export function resolveCollectionImages(
  collectionCode: string,
  collectionName?: string,
  imageRoot: string = IMAGE_DIR,
): { images: string[]; primaryImage: string; imageFolder: string } {
  const candidates: { path: string; folderKey: string }[] = [];

  // Check BA subfolder paths first: collections/{BA}/{collectionName}/
  if (collectionName) {
    const collectionsDir = join(imageRoot, 'collections');
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
      path: join(imageRoot, 'collections', collectionName),
      folderKey: `collections/${collectionName}`,
    });
  }

  candidates.push({
    path: join(imageRoot, 'collections', collectionCode),
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
