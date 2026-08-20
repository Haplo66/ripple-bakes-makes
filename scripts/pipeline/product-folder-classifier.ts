/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

/**
 * Product folder classifier.
 *
 * Decides which Drive leaf folders under "Product Images" are product image
 * folders. The current product catalog (products.json) is the source of truth.
 * Matching identity hierarchy:
 *   - Product ID = stable identity (folder name equal to the ID matches directly)
 *   - Product name = mutable display value (exact or singular/plural-tolerant match)
 *   - Drive folder = asset location (the asset manifest records the folder name
 *     for a Product ID, so a folder whose name matches a manifest entry is
 *     resolved to that product by its ID; this keeps renamed products working)
 * The asset manifest is used as a checksum cache, an ID-based rename bridge,
 * and to report stale entries.
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
      matchedBy: 'name' | 'id' | 'manifest-folder' | 'normalized';
      manifestEntry: ManifestProductEntry | undefined;
    }
  | { kind: 'unmatched'; candidate: FolderCandidate };

export interface StaleManifestEntry {
  code: string;
  folder: string;
  reason: string;
}

/**
 * Normalizes a folder or product name for forgiving singular/plural matching
 * (e.g. "Bucket Hat" vs "Bucket Hats"). Lowercases, removes punctuation and
 * spacing, then strips a single trailing plural suffix.
 */
export function normalizeFolderName(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (base.endsWith('ies')) return `${base.slice(0, -3)}y`;
  if (base.endsWith('es')) return base.slice(0, -2);
  if (base.endsWith('s')) return base.slice(0, -1);
  return base;
}

function buildUniqueMap(values: [string, string][]): Map<string, string> {
  const map = new Map<string, string>();
  const counts = new Map<string, number>();
  for (const [key, value] of values) {
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (map.get(key) === value) continue;
    map.set(key, value);
  }
  for (const [key, count] of counts) {
    if (count > 1) map.delete(key);
  }
  return map;
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
  const folderToCode = new Map<string, string>();
  for (const entry of manifestProducts) {
    codeToManifest.set(entry.code, entry);
    folderToCode.set(entry.folder, entry.code);
  }
  const folderToManifestCode = buildUniqueMap([...folderToCode.entries()]);

  const normalizedToProducts = new Map<string, CatalogProduct[]>();
  for (const product of catalog) {
    const key = normalizeFolderName(product.name);
    const list = normalizedToProducts.get(key) ?? [];
    list.push(product);
    normalizedToProducts.set(key, list);
  }

  const verdicts: FolderVerdict[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    if (seen.has(candidate.fullPath)) continue;
    seen.add(candidate.fullPath);

    const byName = nameToProduct.get(candidate.name);
    const product = byName ?? idToProduct.get(candidate.name);

    if (product) {
      verdicts.push({
        kind: 'product',
        candidate,
        product,
        matchedBy: byName ? 'name' : 'id',
        manifestEntry: codeToManifest.get(product.id),
      });
      continue;
    }

    const manifestCode = folderToManifestCode.get(candidate.name);
    if (manifestCode) {
      const productById = idToProduct.get(manifestCode);
      if (productById) {
        verdicts.push({
          kind: 'product',
          candidate,
          product: productById,
          matchedBy: 'manifest-folder',
          manifestEntry: codeToManifest.get(manifestCode),
        });
        continue;
      }
    }

    const normalizedProduct = normalizedToProducts.get(normalizeFolderName(candidate.name));
    if (normalizedProduct && normalizedProduct.length === 1) {
      const matched = normalizedProduct[0];
      verdicts.push({
        kind: 'product',
        candidate,
        product: matched,
        matchedBy: 'normalized',
        manifestEntry: codeToManifest.get(matched.id),
      });
      continue;
    }

    verdicts.push({ kind: 'unmatched', candidate });
  }

  return verdicts;
}

export function findStaleManifestProducts(
  manifestProducts: ManifestProductEntry[],
  catalog: CatalogProduct[],
): StaleManifestEntry[] {
  const catalogIds = new Set<string>();
  for (const product of catalog) {
    catalogIds.add(product.id);
  }

  const stale: StaleManifestEntry[] = [];
  for (const entry of manifestProducts) {
    if (catalogIds.has(entry.code)) continue;
    stale.push({
      code: entry.code,
      folder: entry.folder,
      reason: `Product ${entry.code} no longer exists in the catalog.`,
    });
  }

  return stale;
}
