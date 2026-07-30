/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved.
 *
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PROJECT_ROOT, MANIFEST_DIR } from '../pipeline/constants.ts';
import type { ResolvedImages } from '../pipeline/image-resolver.ts';

const HEADER = 'RIPPLE Local Asset Cleanup';
const ALLOWED_IMAGE = /\.(jpg|jpeg|png|webp)$/i;
const PRODUCT_IMAGE_DIR = join(PROJECT_ROOT, 'public', 'images', 'products');
const COLLECTION_IMAGE_DIR = join(PROJECT_ROOT, 'public', 'images', 'collections');
const BA_SLUG_TO_NAME: Record<string, string> = {
  bakery: 'Bakery',
  sewing: 'Sewing',
};

interface CliOptions {
  dryRun: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv;
  const execute = args.includes('--execute');
  const dryRun = !execute;

  if (dryRun) {
    console.log('Mode: VALIDATION (read-only). Use --execute to migrate files.');
  }
  return { dryRun };
}

interface ProductRecord {
  id: string;
  name: string;
  businessArea: string;
  image: string;
  imageFolder: string;
  images: string[];
}

interface CollectionRecord {
  id: string;
  name: string;
  imageFolder: string;
}

interface MoveAction {
  sourceFile: string;
  targetFile: string;
  baName: string;
  itemType: 'product' | 'collection';
  itemName: string;
}

interface CleanupResult {
  products: {
    expected: number;
    baFoldersMissing: number;
    filesMoved: number;
    conflicts: { folder: string; files: string[] }[];
    orphans: string[];
  };
  collections: {
    expected: number;
    baFoldersMissing: number;
    filesMoved: number;
    conflicts: { folder: string; files: string[] }[];
    orphans: string[];
  };
  emptyDirsRemoved: number;
  errors: string[];
}

function isAllowedImage(fileName: string): boolean {
  return ALLOWED_IMAGE.test(fileName);
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function getExpectedProductBAMapping(): Map<string, string> {
  const mapping = new Map<string, string>();

  const productsFile = join(PROJECT_ROOT, 'src', 'content', 'products.json');
  const data = readJsonFile<{ data: ProductRecord[] }>(productsFile);
  if (!data || !data.data) {
    console.error('  Could not read products.json');
    return mapping;
  }

  for (const product of data.data) {
    const baName = BA_SLUG_TO_NAME[product.businessArea] || product.businessArea;
    mapping.set(product.name, baName);
  }

  return mapping;
}

function getExpectedCollectionBAMapping(): Map<string, string> {
  const mapping = new Map<string, string>();

  const collectionsFile = join(PROJECT_ROOT, 'src', 'content', 'collections.json');
  const data = readJsonFile<{ data: CollectionRecord[] }>(collectionsFile);
  if (!data || !data.data) {
    console.error('  Could not read collections.json');
    return mapping;
  }

  for (const collection of data.data) {
    const folder = collection.imageFolder;
    if (!folder) continue;

    const parts = folder.split('/');
    if (parts.length >= 3 && parts[0] === 'collections') {
      mapping.set(collection.name, parts[1]);
    }
  }

  return mapping;
}

function scanFlatFolders(baseDir: string): string[] {
  if (!existsSync(baseDir)) return [];

  return readdirSync(baseDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(name => !name.includes('/') && name !== 'Bakery' && name !== 'Sewing')
    .sort();
}

function isBaSubfolder(name: string): boolean {
  return name === 'Bakery' || name === 'Sewing';
}

function scanFilesInFolder(dirPath: string): string[] {
  if (!existsSync(dirPath)) return [];

  return readdirSync(dirPath)
    .filter(isAllowedImage)
    .sort();
}

function planProductMoves(
  productBAMap: Map<string, string>,
  dryRun: boolean,
): { moves: MoveAction[]; conflicts: { folder: string; files: string[] }[]; orphans: string[]; baFoldersMissing: Set<string> } {
  const moves: MoveAction[] = [];
  const conflicts: { folder: string; files: string[] }[] = [];
  const orphans: string[] = [];
  const baFoldersMissing = new Set<string>();

  const flatFolders = scanFlatFolders(PRODUCT_IMAGE_DIR);

  for (const folderName of flatFolders) {
    const baName = productBAMap.get(folderName);
    if (!baName) {
      orphans.push(folderName);
      continue;
    }

    const flatPath = join(PRODUCT_IMAGE_DIR, folderName);
    const files = scanFilesInFolder(flatPath);

    if (files.length === 0) continue;

    const targetDir = join(PRODUCT_IMAGE_DIR, baName, folderName);
    const targetFiles = scanFilesInFolder(targetDir);

    if (targetFiles.length > 0) {
      const dupFiles = files.filter(f => targetFiles.includes(f));
      if (dupFiles.length > 0) {
        conflicts.push({ folder: folderName, files: dupFiles });
        continue;
      }
    }

    if (!dryRun && !existsSync(targetDir)) {
      baFoldersMissing.add(baName);
    }

    for (const file of files) {
      moves.push({
        sourceFile: join(flatPath, file),
        targetFile: join(targetDir, file),
        baName,
        itemType: 'product',
        itemName: folderName,
      });
    }
  }

  return { moves, conflicts, orphans, baFoldersMissing };
}

function planCollectionMoves(
  collectionBAMap: Map<string, string>,
  dryRun: boolean,
): { moves: MoveAction[]; conflicts: { folder: string; files: string[] }[]; orphans: string[]; baFoldersMissing: Set<string> } {
  const moves: MoveAction[] = [];
  const conflicts: { folder: string; files: string[] }[] = [];
  const orphans: string[] = [];
  const baFoldersMissing = new Set<string>();

  const flatFolders = scanFlatFolders(COLLECTION_IMAGE_DIR);

  for (const folderName of flatFolders) {
    const baName = collectionBAMap.get(folderName);
    if (!baName) {
      orphans.push(folderName);
      continue;
    }

    const flatPath = join(COLLECTION_IMAGE_DIR, folderName);
    const files = scanFilesInFolder(flatPath);

    if (files.length === 0) continue;

    const targetDir = join(COLLECTION_IMAGE_DIR, baName, folderName);
    const targetFiles = scanFilesInFolder(targetDir);

    if (targetFiles.length > 0) {
      const dupFiles = files.filter(f => targetFiles.includes(f));
      if (dupFiles.length > 0) {
        conflicts.push({ folder: folderName, files: dupFiles });
        continue;
      }
    }

    if (!dryRun && !existsSync(targetDir)) {
      baFoldersMissing.add(baName);
    }

    for (const file of files) {
      moves.push({
        sourceFile: join(flatPath, file),
        targetFile: join(targetDir, file),
        baName,
        itemType: 'collection',
        itemName: folderName,
      });
    }
  }

  return { moves, conflicts, orphans, baFoldersMissing };
}

function executeMoves(moves: MoveAction[], dryRun: boolean): number {
  let moved = 0;

  for (const move of moves) {
    const targetDir = join(move.targetFile, '..');

    if (dryRun) {
      const relSource = relative(PROJECT_ROOT, move.sourceFile);
      const relTarget = relative(PROJECT_ROOT, move.targetFile);
      console.log(`    → ${relSource} → ${relTarget}`);
      moved++;
      continue;
    }

    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    if (existsSync(move.targetFile)) {
      continue;
    }

    try {
      renameSync(move.sourceFile, move.targetFile);
      moved++;
    } catch (error) {
      console.error(`    ✗ Failed to move ${move.sourceFile}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return moved;
}

function removeEmptyFolders(baseDir: string, flatFolderNames: string[], movedNames: Set<string>, dryRun: boolean): number {
  let removed = 0;

  for (const name of flatFolderNames) {
    if (!movedNames.has(name)) continue;

    const dirPath = join(baseDir, name);
    if (!existsSync(dirPath)) continue;

    const remaining = readdirSync(dirPath);
    if (remaining.length > 0) continue;

    if (dryRun) {
      console.log(`    (would remove empty folder: ${name}/)`);
      removed++;
      continue;
    }

    try {
      rmSync(dirPath, { recursive: true });
      removed++;
    } catch (error) {
      console.error(`    ✗ Failed to remove empty folder ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return removed;
}

function validateStructure(
  productBAMap: Map<string, string>,
  collectionBAMap: Map<string, string>,
  result: CleanupResult,
): void {
  console.log('');
  console.log('── Validation ──');
  console.log('');

  // Check expected product BA folders
  const productBaSeen = new Set<string>();
  for (const [productName, baName] of productBAMap) {
    if (productBaSeen.has(baName)) continue;
    productBaSeen.add(baName);

    const baDir = join(PRODUCT_IMAGE_DIR, baName);
    if (existsSync(baDir)) {
      console.log(`  ✓ products/${baName}/ exists`);
    } else {
      console.log(`  ⚠ products/${baName}/ missing`);
      result.products.baFoldersMissing++;
    }
  }

  // Check expected collection BA folders
  const collBaSeen = new Set<string>();
  for (const [collName, baName] of collectionBAMap) {
    if (collBaSeen.has(baName)) continue;
    collBaSeen.add(baName);

    const baDir = join(COLLECTION_IMAGE_DIR, baName);
    if (existsSync(baDir)) {
      console.log(`  ✓ collections/${baName}/ exists`);
    } else {
      console.log(`  ⚠ collections/${baName}/ missing`);
      result.collections.baFoldersMissing++;
    }
  }

  // Check for orphan flat product folders
  const allProductFlat = scanFlatFolders(PRODUCT_IMAGE_DIR);
  for (const name of allProductFlat) {
    if (!productBAMap.has(name)) {
      const path = join(PRODUCT_IMAGE_DIR, name);
      const files = scanFilesInFolder(path);
      if (files.length > 0) {
        console.log(`  ⚠ Orphan product folder products/${name}/ (${files.length} file(s) — no matching product)`);
        result.products.orphans.push(name);
      }
    }
  }

  // Check for orphan flat collection folders
  const allCollFlat = scanFlatFolders(COLLECTION_IMAGE_DIR);
  for (const name of allCollFlat) {
    if (!collectionBAMap.has(name)) {
      const path = join(COLLECTION_IMAGE_DIR, name);
      const files = scanFilesInFolder(path);
      if (files.length > 0) {
        console.log(`  ⚠ Orphan collection folder collections/${name}/ (${files.length} file(s) — no matching collection)`);
        result.collections.orphans.push(name);
      }
    }
  }

  // Check for duplicate images (both flat and BA-subfolder versions)
  for (const [name, baName] of productBAMap) {
    const flatPath = join(PRODUCT_IMAGE_DIR, name);
    const baPath = join(PRODUCT_IMAGE_DIR, baName, name);
    const flatFiles = scanFilesInFolder(flatPath);
    const baFiles = scanFilesInFolder(baPath);

    if (flatFiles.length > 0 && baFiles.length > 0) {
      const dupes = flatFiles.filter(f => baFiles.includes(f));
      if (dupes.length > 0) {
        console.log(`  ⚠ Duplicate product images: products/${name}/ and products/${baName}/${name}/ share ${dupes.length} file(s)`);
        result.products.conflicts.push({ folder: name, files: dupes });
      }
    }
  }

  for (const [name, baName] of collectionBAMap) {
    const flatPath = join(COLLECTION_IMAGE_DIR, name);
    const baPath = join(COLLECTION_IMAGE_DIR, baName, name);
    const flatFiles = scanFilesInFolder(flatPath);
    const baFiles = scanFilesInFolder(baPath);

    if (flatFiles.length > 0 && baFiles.length > 0) {
      const dupes = flatFiles.filter(f => baFiles.includes(f));
      if (dupes.length > 0) {
        console.log(`  ⚠ Duplicate collection images: collections/${name}/ and collections/${baName}/${name}/ share ${dupes.length} file(s)`);
        result.collections.conflicts.push({ folder: name, files: dupes });
      }
    }
  }
}

async function run(): Promise<void> {
  const { dryRun } = parseArgs();

  console.log(HEADER);
  console.log(dryRun ? 'Mode: DRY RUN' : 'Mode: EXECUTE');
  console.log('');

  const result: CleanupResult = {
    products: { expected: 0, baFoldersMissing: 0, filesMoved: 0, conflicts: [], orphans: [] },
    collections: { expected: 0, baFoldersMissing: 0, filesMoved: 0, conflicts: [], orphans: [] },
    emptyDirsRemoved: 0,
    errors: [],
  };

  // ── Read expected mappings ──
  console.log('Reading expected mappings from generated JSON...');
  const productBAMap = getExpectedProductBAMapping();
  const collectionBAMap = getExpectedCollectionBAMapping();
  result.products.expected = productBAMap.size;
  result.collections.expected = collectionBAMap.size;
  console.log(`  Products: ${productBAMap.size} mappings`);
  console.log(`  Collections: ${collectionBAMap.size} mappings`);
  console.log('');

  // ── Product images ──
  console.log('── Product Images ──');
  console.log('');

  if (!existsSync(PRODUCT_IMAGE_DIR)) {
    console.log('  (no products directory)');
  } else {
    const { moves, conflicts, orphans, baFoldersMissing } = planProductMoves(productBAMap, dryRun);

    if (moves.length === 0 && conflicts.length === 0 && orphans.length === 0) {
      console.log('  No flat product folders to migrate.');
    } else {
      if (moves.length > 0) {
        console.log(`  Files to move: ${moves.length}`);
        const moved = executeMoves(moves, dryRun);
        result.products.filesMoved = moved;

        const movedNames = new Set(moves.map(m => m.itemName));
        const removed = removeEmptyFolders(PRODUCT_IMAGE_DIR, [...movedNames], movedNames, dryRun);
        result.emptyDirsRemoved += removed;
      }

      if (conflicts.length > 0) {
        console.log(`  Conflicts (files exist at both locations):`);
        for (const c of conflicts) {
          console.log(`    ⚠ products/${c.folder}/  →  products/${productBAMap.get(c.folder)}/${c.folder}/ (${c.files.length} file(s))`);
          result.products.conflicts.push(c);
        }
      }

      if (orphans.length > 0) {
        console.log(`  Orphans (flat folders with no product mapping):`);
        for (const o of orphans) {
          const flatPath = join(PRODUCT_IMAGE_DIR, o);
          const files = scanFilesInFolder(flatPath);
          console.log(`    ⚠ products/${o}/ (${files.length} file(s) — unknown product)`);
          result.products.orphans.push(o);
        }
      }
    }
  }
  console.log('');

  // ── Collection images ──
  console.log('── Collection Images ──');
  console.log('');

  if (!existsSync(COLLECTION_IMAGE_DIR)) {
    console.log('  (no collections directory)');
  } else {
    const { moves, conflicts, orphans, baFoldersMissing } = planCollectionMoves(collectionBAMap, dryRun);

    if (moves.length === 0 && conflicts.length === 0 && orphans.length === 0) {
      console.log('  No flat collection folders to migrate.');
    } else {
      if (moves.length > 0) {
        console.log(`  Files to move: ${moves.length}`);
        const moved = executeMoves(moves, dryRun);
        result.collections.filesMoved = moved;

        const movedNames = new Set(moves.map(m => m.itemName));
        const removed = removeEmptyFolders(COLLECTION_IMAGE_DIR, [...movedNames], movedNames, dryRun);
        result.emptyDirsRemoved += removed;
      }

      if (conflicts.length > 0) {
        console.log(`  Conflicts (files exist at both locations):`);
        for (const c of conflicts) {
          console.log(`    ⚠ collections/${c.folder}/  →  collections/${collectionBAMap.get(c.folder)}/${c.folder}/ (${c.files.length} file(s))`);
          result.collections.conflicts.push(c);
        }
      }

      if (orphans.length > 0) {
        console.log(`  Orphans (flat folders with no collection mapping):`);
        for (const o of orphans) {
          const flatPath = join(COLLECTION_IMAGE_DIR, o);
          const files = scanFilesInFolder(flatPath);
          console.log(`    ⚠ collections/${o}/ (${files.length} file(s) — unknown collection)`);
          result.collections.orphans.push(o);
        }
      }
    }
  }
  console.log('');

  // ── Validate ──
  validateStructure(productBAMap, collectionBAMap, result);

  // ── Summary ──
  console.log('');
  console.log('── Summary ──');
  console.log('');
  console.log(`  Product files moved:        ${result.products.filesMoved}`);
  console.log(`  Collection files moved:     ${result.collections.filesMoved}`);
  console.log(`  Empty dirs removed:         ${result.emptyDirsRemoved}`);
  console.log(`  Product conflicts:          ${result.products.conflicts.length}`);
  console.log(`  Collection conflicts:       ${result.collections.conflicts.length}`);
  console.log(`  Product orphans:            ${result.products.orphans.length}`);
  console.log(`  Collection orphans:         ${result.collections.orphans.length}`);
  console.log(`  Missing BA folders:         ${result.products.baFoldersMissing + result.collections.baFoldersMissing}`);
  console.log(`  Errors:                     ${result.errors.length}`);

  if (dryRun) {
    console.log('');
    console.log('No files changed (dry run).');
  } else {
    console.log('');
    console.log('Cleanup completed.');
  }
}

await run();
