/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

/**
 * Product folder classifier.
 *
 * Decides which Drive leaf folders under "Product Images" are product image
 * folders. The current product catalog (products.json) is the source of truth:
 * a folder is a product folder when its name matches a current product name or
 * product id. The asset manifest is used only as a checksum cache and to report
 * stale entries - never to decide whether a folder should be discovered.
 *
 * This module is pure (no I/O) so it can be tested directly.
 */

export interface CatalogProduct {
  id: string;
  name: string;
}

export interface ManifestFile {
  name: string;
  md5: string;
  primary: boolean;
}

export interface ManifestProductEntry {
  code: string;
  folder: string;
  files: ManifestFile[];
}

export interface FolderCandidate {
  id: string;
  name: string;
  fullPath: string;
}

export type FolderVerdict =
  | {
      kind: 'product';
      candidate: FolderCandidate;
      product: CatalogProduct;
      matchedBy: 'name' | 'id';
      manifestEntry: ManifestProductEntry | undefined;
    }
  | { kind: 'unmatched'; candidate: FolderCandidate };

export interface StaleManifestEntry {
  code: string;
  folder: string;
  reason: string;
}

export function classifyProductFolders(
  candidates: FolderCandidate[],
  catalog: CatalogProduct[],
  manifestProducts: ManifestProductEntry[],
): FolderVerdict[] {
  const nameToProduct = new Map<string, CatalogProduct>();
  for (const product of catalog) {
    nameToProduct.set(product.name, product);
  }

  const idToProduct = new Map<string, CatalogProduct>();
  for (const product of catalog) {
    idToProduct.set(product.id, product);
  }

  const codeToManifest = new Map<string, ManifestProductEntry>();
  for (const entry of manifestProducts) {
    codeToManifest.set(entry.code, entry);
  }

  const verdicts: FolderVerdict[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    if (seen.has(candidate.fullPath)) continue;
    seen.add(candidate.fullPath);

    const byName = nameToProduct.get(candidate.name);
    const product = byName ?? idToProduct.get(candidate.name);

    if (!product) {
      verdicts.push({ kind: 'unmatched', candidate });
      continue;
    }

    verdicts.push({
      kind: 'product',
      candidate,
      product,
      matchedBy: byName ? 'name' : 'id',
      manifestEntry: codeToManifest.get(product.id),
    });
  }

  return verdicts;
}

export function findStaleManifestProducts(
  manifestProducts: ManifestProductEntry[],
  catalog: CatalogProduct[],
): StaleManifestEntry[] {
  const nameByCode = new Map<string, string>();
  for (const product of catalog) {
    nameByCode.set(product.id, product.name);
  }

  const stale: StaleManifestEntry[] = [];
  for (const entry of manifestProducts) {
    const expectedName = nameByCode.get(entry.code);
    if (expectedName === undefined) {
      stale.push({
        code: entry.code,
        folder: entry.folder,
        reason: `Product ${entry.code} no longer exists in the catalog.`,
      });
      continue;
    }
    if (expectedName !== entry.folder) {
      stale.push({
        code: entry.code,
        folder: entry.folder,
        reason: `Folder name "${entry.folder}" does not match the current product name "${expectedName}".`,
      });
    }
  }

  return stale;
}
