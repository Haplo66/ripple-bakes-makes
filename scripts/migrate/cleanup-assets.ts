/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { authenticateDriveWithWrite } from '../pipeline/drive-write-auth.ts';
import { authenticateSheets } from '../pipeline/sheets-auth.ts';
import { readSheet } from '../pipeline/sheets-reader.ts';
import { findChildFolder, listDriveItems, DRIVE_FOLDER_MIME } from './drive-renamer.ts';
import { readCsvFile } from '../pipeline/csv-reader.ts';
import { MANIFEST_DIR, MANIFEST_FILE, PROJECT_ROOT } from '../pipeline/constants.ts';
import type { PipelineWarning, CsvRecord } from '../pipeline/types.ts';

const HEADER = 'RIPPLE Asset Cleanup';
const ALLOWED_IMAGE = /\.(jpg|jpeg|png|webp)$/i;
const PRODUCT_ID_PATTERN = /^[A-Z]{2}-[A-Z]{2}-\d{3}$/;
const BA_SLUG_TO_NAME: Record<string, string> = {
  bakery: 'Bakery',
  sewing: 'Sewing',
};

type DriveClient = Awaited<ReturnType<typeof authenticateDriveWithWrite>>;

interface CliOptions {
  dryRun: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv;
  const dryRun = args.includes('--dry-run');
  const execute = args.includes('--execute');

  if (!dryRun && !execute) {
    console.error('Usage:');
    console.error('  npm run cleanup:assets -- --dry-run');
    console.error('  npm run cleanup:assets -- --execute');
    process.exit(1);
  }

  return { dryRun };
}

function isImageFile(item: { mimeType: string; name: string }): boolean {
  return item.mimeType !== DRIVE_FOLDER_MIME && ALLOWED_IMAGE.test(item.name);
}

async function resolveAssetsRoot(drive: DriveClient, rootId: string): Promise<string> {
  const assetsId = await findChildFolder(drive, rootId, 'Assets');
  if (!assetsId) throw new Error('Could not find "Assets" folder under the root.');
  return assetsId;
}

interface BaResult {
  baName: string;
  filesToMove: number;
  shouldDelete: boolean;
  conflictFiles: string[];
  warnings: string[];
}

async function fixBaDuplicateFolders(
  drive: DriveClient,
  sectionId: string,
  dryRun: boolean,
): Promise<BaResult[]> {
  const baFolders = await listDriveItems(drive, sectionId);
  const results: BaResult[] = [];

  for (const baFolder of baFolders) {
    if (baFolder.mimeType !== DRIVE_FOLDER_MIME) continue;

    const children = await listDriveItems(drive, baFolder.id);
    const subfolders = children.filter(c => c.mimeType === DRIVE_FOLDER_MIME);
    const duplicateFolder = subfolders.find(sf => sf.name === baFolder.name);

    if (!duplicateFolder) continue;

    const dupContents = await listDriveItems(drive, duplicateFolder.id);
    const dupFiles = dupContents.filter(isImageFile);
    const existingFiles = children.filter(isImageFile);
    const existingNames = new Set(existingFiles.map(f => f.name));
    const conflicts = dupFiles.filter(f => existingNames.has(f.name));

    const result: BaResult = {
      baName: baFolder.name,
      filesToMove: dupFiles.length,
      shouldDelete: dupFiles.length === 0 || conflicts.length === 0,
      conflictFiles: conflicts.map(f => f.name),
      warnings: [],
    };

    if (dupFiles.length === 0) {
      result.warnings.push('Duplicate folder is empty, will be removed');
    }

    if (!dryRun && result.shouldDelete && conflicts.length === 0) {
      for (const file of dupFiles) {
        try {
          await drive.files.update({
            fileId: file.id,
            addParents: baFolder.id,
            removeParents: duplicateFolder.id,
            fields: 'id, parents',
          });
        } catch (error) {
          result.shouldDelete = false;
          result.warnings.push(
            `Failed to move ${file.name}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      if (result.shouldDelete) {
        try {
          await drive.files.delete({ fileId: duplicateFolder.id });
        } catch (error) {
          result.warnings.push(
            `Failed to delete folder: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }

    results.push(result);
  }

  return results;
}

interface CollectionEntry {
  name: string;
  businessArea: string;
}

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

/** Read records from Google Sheets (with CSV fallback). */
async function readSourceRecords(): Promise<{ productRecords: CsvRecord[]; collectionRecords: CsvRecord[] }> {
  const spreadsheetId = process.env.INVENTORY_GOOGLE_SHEETS_ID;
  const warnings: PipelineWarning[] = [];

  if (spreadsheetId) {
    try {
      const sheets = await authenticateSheets();
      const prodResult = await readSheet('products', sheets, spreadsheetId, warnings);
      const collResult = await readSheet('collections', sheets, spreadsheetId, warnings);
      if (prodResult.found && collResult.found) {
        console.log('  Source: Google Sheets');
        return { productRecords: prodResult.records, collectionRecords: collResult.records };
      }
    } catch {
      // fall through
    }
  }

  const prodCsv = readCsvFile('products.csv', warnings);
  const collCsv = readCsvFile('collections.csv', warnings);
  if (prodCsv.found && collCsv.found) {
    console.log('  Source: CSV (offline)');
    return { productRecords: prodCsv.records, collectionRecords: collCsv.records };
  }

  return { productRecords: [], collectionRecords: [] };
}

/** Derive expected collection names with business area from source data. */
function buildExpectedCollections(
  productRecords: CsvRecord[],
  collectionRecords: CsvRecord[],
): CollectionEntry[] {
  // Build collection slug → { name, businessArea } from Collections data
  const collLookup = new Map<string, { name: string; businessArea: string }>();
  for (const r of collectionRecords) {
    const rawId = r.values.id || r.values['Collection ID'] || '';
    const name = r.values.name || r.values['Collection Name'] || '';
    const baRaw = (r.values.businessArea || r.values['Business Area'] || '').trim().toLowerCase();
    if (rawId && name) collLookup.set(slugify(rawId), { name: name.trim(), businessArea: baRaw });
  }

  const seen = new Set<string>();
  const result: CollectionEntry[] = [];

  for (const r of productRecords) {
    const productId = (r.values.id || r.values['Product ID'] || '').trim();
    if (!PRODUCT_ID_PATTERN.test(productId)) continue;

    const status = (r.values.status || r.values['Status'] || 'Active').trim().toLowerCase();
    const active = (r.values.active || r.values['Active'] || 'true').trim().toLowerCase();
    if (status !== 'active') continue;
    if (active !== 'true') continue;

    const collSlug = slugify(r.values.collection || r.values['Collection'] || '');
    if (!collSlug || seen.has(collSlug)) continue;
    seen.add(collSlug);

    const entry = collLookup.get(collSlug);
    if (entry) result.push(entry);
  }

  return result;
}

interface CollRestructureResult {
  baFoldersCreated: string[];
  collectionsMoved: { name: string; from: string; to: string }[];
  collectionsCreated: string[];
  warnings: string[];
  errors: string[];
}

async function restructureCollectionFolders(
  drive: DriveClient,
  sectionId: string,
  expectedCollections: CollectionEntry[],
  dryRun: boolean,
): Promise<CollRestructureResult> {
  const result: CollRestructureResult = {
    baFoldersCreated: [],
    collectionsMoved: [],
    collectionsCreated: [],
    warnings: [],
    errors: [],
  };

  const existingFolders = await listDriveItems(drive, sectionId);
  const collFolderByName = new Map<string, { id: string; name: string }>();
  const existingNames = new Set<string>();

  for (const f of existingFolders) {
    if (f.mimeType !== DRIVE_FOLDER_MIME) continue;
    collFolderByName.set(f.name, { id: f.id, name: f.name });
    existingNames.add(f.name);
  }

  // 1. Create/identify BA subfolders
  const baNames = new Set<string>();
  for (const coll of expectedCollections) {
    const baName = BA_SLUG_TO_NAME[coll.businessArea] || coll.businessArea;
    baNames.add(baName);
  }

  const baFolderIdByName = new Map<string, string>();
  const baWouldCreate: string[] = [];

  for (const baName of baNames) {
    const existing = collFolderByName.get(baName);
    if (existing) {
      baFolderIdByName.set(baName, existing.id);
      continue;
    }

    baWouldCreate.push(baName);
    result.baFoldersCreated.push(baName);

    if (!dryRun) {
      try {
        const created = await drive.files.create({
          requestBody: { name: baName, mimeType: DRIVE_FOLDER_MIME, parents: [sectionId] },
          fields: 'id',
        });
        baFolderIdByName.set(baName, created.data.id!);
      } catch (error) {
        result.errors.push(`Failed to create BA folder "${baName}": ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  // In dry-run: simulate BA folder IDs so collection logic can proceed
  if (dryRun) {
    for (const name of baWouldCreate) {
      baFolderIdByName.set(name, '__dryrun__');
    }
  } else if (baWouldCreate.length > 0) {
    // Re-list to get IDs of freshly created BA folders
    const updatedFolders = await listDriveItems(drive, sectionId);
    for (const f of updatedFolders) {
      if (f.mimeType !== DRIVE_FOLDER_MIME) continue;
      baFolderIdByName.set(f.name, f.id);
    }
  }

  // Pre-fetch contents of BA folders in dry-run so we know what's inside
  const baContentsCache = new Map<string, Set<string>>();
  async function getBaSubfolderNames(baName: string): Promise<Set<string>> {
    if (baContentsCache.has(baName)) return baContentsCache.get(baName)!;
    const baFolderId = baFolderIdByName.get(baName);
    if (!baFolderId || baFolderId === '__dryrun__') {
      const s = new Set<string>();
      baContentsCache.set(baName, s);
      return s;
    }
    const contents = await listDriveItems(drive, baFolderId);
    const names = new Set(contents.filter(f => f.mimeType === DRIVE_FOLDER_MIME).map(f => f.name));
    baContentsCache.set(baName, names);
    return names;
  }

  // 2. Process each expected collection
  for (const coll of expectedCollections) {
    const baName = BA_SLUG_TO_NAME[coll.businessArea] || coll.businessArea;
    const baFolderId = baFolderIdByName.get(baName);

    if (!baFolderId) {
      result.errors.push(`${coll.name}: no BA folder available for "${baName}"`);
      continue;
    }

    // Check if collection folder exists at top level
    const topLevel = collFolderByName.get(coll.name);

    // Check if already inside the correct BA folder
    const baSubfolderNames = await getBaSubfolderNames(baName);
    if (baSubfolderNames.has(coll.name)) {
      continue;
    }

    if (topLevel) {
      // Check if already parented to correct BA (from a previous run)
      if (!dryRun && baFolderId !== '__dryrun__') {
        const parents = await getItemParents(drive, topLevel.id);
        if (parents.has(baFolderId)) {
          continue;
        }
      }

      // Conflict check: target name exists in BA folder
      if (baSubfolderNames.has(coll.name)) {
        result.warnings.push(`${coll.name}: already exists inside "${baName}" (skipping move)`);
        continue;
      }

      result.collectionsMoved.push({ name: coll.name, from: 'root', to: baName });

      if (!dryRun) {
        try {
          await drive.files.update({
            fileId: topLevel.id,
            addParents: baFolderId,
            removeParents: sectionId,
            fields: 'id, parents',
          });
        } catch (error) {
          result.errors.push(`Failed to move ${coll.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } else {
      result.collectionsCreated.push(coll.name);

      if (!dryRun) {
        try {
          await drive.files.create({
            requestBody: { name: coll.name, mimeType: DRIVE_FOLDER_MIME, parents: [baFolderId] },
            fields: 'id',
          });
        } catch (error) {
          result.errors.push(`Failed to create ${coll.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  }

  return result;
}

async function getItemParents(drive: DriveClient, fileId: string): Promise<Set<string>> {
  try {
    const response = await drive.files.get({ fileId, fields: 'parents' });
    return new Set(response.data.parents || []);
  } catch {
    return new Set();
  }
}

interface ProductFolderMove {
  name: string;
  baName: string;
  status: 'moved' | 'conflict' | 'already-there' | 'not-found';
  details?: string;
}

interface ProductMigrationResult {
  moves: ProductFolderMove[];
  conflicts: ProductFolderMove[];
  alreadyThere: ProductFolderMove[];
  notFound: ProductFolderMove[];
  errors: string[];
}

function readProductMapping(): Map<string, string> {
  const mapping = new Map<string, string>();

  const productsFile = join(PROJECT_ROOT, 'src', 'content', 'products.json');
  if (!existsSync(productsFile)) return mapping;

  try {
    const data = JSON.parse(readFileSync(productsFile, 'utf-8'));
    if (!data.data || !Array.isArray(data.data)) return mapping;

    for (const product of data.data) {
      if (product.name && product.businessArea) {
        const baName = BA_SLUG_TO_NAME[product.businessArea] || product.businessArea;
        mapping.set(product.name, baName);
      }
    }
  } catch {
    return mapping;
  }

  return mapping;
}

async function migrateFlatProductFolders(
  drive: DriveClient,
  sectionId: string,
  dryRun: boolean,
): Promise<ProductMigrationResult> {
  const result: ProductMigrationResult = {
    moves: [],
    conflicts: [],
    alreadyThere: [],
    notFound: [],
    errors: [],
  };

  const productBAMap = readProductMapping();
  if (productBAMap.size === 0) {
    result.errors.push('Could not read product mapping from products.json');
    return result;
  }

  const rootFolders = await listDriveItems(drive, sectionId);
  const baFolderIds = new Map<string, string>();
  const baFolderNames = new Set<string>();

  let flatCount = 0;
  for (const f of rootFolders) {
    if (f.mimeType !== DRIVE_FOLDER_MIME) continue;
    if (f.name === 'Bakery' || f.name === 'Sewing') {
      baFolderIds.set(f.name, f.id);
      baFolderNames.add(f.name);
    } else {
      flatCount++;
    }
  }
  const allFolderNames = rootFolders.filter(f => f.mimeType === DRIVE_FOLDER_MIME).map(f => f.name).join(', ');
  console.log(`  Found ${rootFolders.filter(f => f.mimeType === DRIVE_FOLDER_MIME).length} folder(s) (${baFolderIds.size} BA, ${flatCount} flat): ${allFolderNames}`);

  if (baFolderIds.size === 0) {
    result.errors.push('BA subfolders (Bakery/Sewing) not found under Product Images');
    return result;
  }

  // Pre-fetch BA folder contents to check for existing subfolders
  const baContentsCache = new Map<string, Set<string>>();
  for (const [baName, baId] of baFolderIds) {
    const contents = await listDriveItems(drive, baId);
    const names = new Set(
      contents.filter(c => c.mimeType === DRIVE_FOLDER_MIME).map(c => c.name),
    );
    baContentsCache.set(baName, names);
  }

  for (const f of rootFolders) {
    if (f.mimeType !== DRIVE_FOLDER_MIME) continue;
    if (baFolderNames.has(f.name)) continue;

    const baName = productBAMap.get(f.name);
    if (!baName) {
      result.notFound.push({
        name: f.name,
        baName: '',
        status: 'not-found',
        details: 'no product mapping',
      });
      continue;
    }

    const baFolderId = baFolderIds.get(baName);
    if (!baFolderId) {
      result.errors.push(`BA folder "${baName}" not found for product "${f.name}"`);
      continue;
    }

    const existingNames = baContentsCache.get(baName)!;

    if (existingNames.has(f.name)) {
      // Check if already parented to this BA folder
      try {
        const meta = await drive.files.get({ fileId: f.id, fields: 'parents' });
        if (meta.data.parents?.includes(baFolderId)) {
          result.alreadyThere.push({
            name: f.name,
            baName,
            status: 'already-there',
            details: 'already parented to BA folder',
          });
          continue;
        }
      } catch {
        // continue with conflict
      }

      result.conflicts.push({
        name: f.name,
        baName,
        status: 'conflict',
        details: `folder already exists inside ${baName}`,
      });
      continue;
    }

    result.moves.push({ name: f.name, baName, status: 'moved' });

    if (!dryRun) {
      try {
        await drive.files.update({
          fileId: f.id,
          addParents: baFolderId,
          removeParents: sectionId,
          fields: 'id, parents',
        });
      } catch (error) {
        result.errors.push(
          `Failed to move ${f.name}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  return result;
}

async function validateProductStructure(
  drive: DriveClient,
  sectionId: string,
): Promise<void> {
  console.log('');
  console.log('  Post-migration validation:');

  const rootFolders = await listDriveItems(drive, sectionId);
  const flatProductFolders: string[] = [];
  const baFolderIds = new Map<string, string>();

  for (const f of rootFolders) {
    if (f.mimeType !== DRIVE_FOLDER_MIME) continue;
    if (f.name === 'Bakery' || f.name === 'Sewing') {
      baFolderIds.set(f.name, f.id);
    } else {
      flatProductFolders.push(f.name);
    }
  }

  if (flatProductFolders.length === 0) {
    console.log('  ✓ No flat product folders remaining.');
  } else {
    console.log(`  ⚠ ${flatProductFolders.length} flat folder(s) remain: ${flatProductFolders.join(', ')}`);
  }

  for (const [baName, baId] of baFolderIds) {
    const contents = await listDriveItems(drive, baId);
    const productFolders = contents.filter(c => c.mimeType === DRIVE_FOLDER_MIME);
    console.log(`  ✓ ${baName}: ${productFolders.length} product folder(s)`);
  }

  // Check for duplicate folder names across BA subfolders
  const allProductNames = new Map<string, string[]>();
  for (const [baName, baId] of baFolderIds) {
    const contents = await listDriveItems(drive, baId);
    for (const c of contents) {
      if (c.mimeType !== DRIVE_FOLDER_MIME) continue;
      const existing = allProductNames.get(c.name) || [];
      existing.push(baName);
      allProductNames.set(c.name, existing);
    }
  }
  for (const [name, bas] of allProductNames) {
    if (bas.length > 1) {
      console.log(`  ⚠ Duplicate product folder "${name}" across: ${bas.join(', ')}`);
    }
  }
}

async function run(): Promise<void> {
  const { dryRun } = parseArgs();

  console.log(HEADER);
  console.log(dryRun ? 'Mode: DRY RUN' : 'Mode: EXECUTE');
  console.log('');

  const folderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!folderId) {
    console.error('Missing GOOGLE_DRIVE_ROOT_FOLDER_ID environment variable.');
    process.exit(1);
  }

  console.log('Connecting to Google Drive...');
  let drive: DriveClient;
  try {
    drive = await authenticateDriveWithWrite();
    console.log('  Connected');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  Authentication failed: ${message}`);
    process.exit(1);
  }
  console.log('');

  console.log('Locating Assets...');
  let assetsId: string;
  try {
    assetsId = await resolveAssetsRoot(drive, folderId);
    console.log('  Found');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  Failed: ${message}`);
    process.exit(1);
  }
  console.log('');

  const baSectionId = await findChildFolder(drive, assetsId, 'Business Area Images');
  const collSectionId = await findChildFolder(drive, assetsId, 'Collection Images');
  const prodSectionId = await findChildFolder(drive, assetsId, 'Product Images');

  const stepResults: {
    baFilesMoved: number;
    baFoldersDeleted: number;
    baConflicts: number;
    baWarnings: number;
    collBaFoldersCreated: number;
    collMoved: number;
    collCreated: number;
    collWarnings: number;
    collErrors: number;
    prodMoved: number;
    prodConflicts: number;
    prodNotFound: number;
    prodAlreadyThere: number;
    prodErrors: number;
    errors: string[];
  } = {
    baFilesMoved: 0,
    baFoldersDeleted: 0,
    baConflicts: 0,
    baWarnings: 0,
    collBaFoldersCreated: 0,
    collMoved: 0,
    collCreated: 0,
    collWarnings: 0,
    collErrors: 0,
    prodMoved: 0,
    prodConflicts: 0,
    prodNotFound: 0,
    prodAlreadyThere: 0,
    prodErrors: 0,
    errors: [],
  };

  console.log('── Business Area duplicate folders ──');
  console.log('');

  if (!baSectionId) {
    console.log('  Section not found, skipping');
    console.log('');
  } else {
    const baResults = await fixBaDuplicateFolders(drive, baSectionId, dryRun);

    if (baResults.length === 0) {
      console.log('  No duplicates found — structure is clean.');
    } else {
      for (const r of baResults) {
        console.log(`  ${r.baName}:`);
        if (r.filesToMove > 0) {
          console.log(`    Files to move: ${r.filesToMove}`);
        }
        if (r.conflictFiles.length > 0) {
          console.log(`    ⚠ Conflicts: ${r.conflictFiles.join(', ')}`);
        }
        if (r.shouldDelete) {
          console.log(`    Remove duplicate folder: yes`);
        }
        for (const w of r.warnings) {
          console.log(`    ⚠ ${w}`);
        }

        stepResults.baFilesMoved += r.filesToMove;
        stepResults.baConflicts += r.conflictFiles.length;
        stepResults.baWarnings += r.warnings.length;
        if (r.shouldDelete && r.filesToMove > 0) {
          stepResults.baFoldersDeleted++;
        }
      }
    }
    console.log('');
  }

  console.log('── Collection Images hierarchy (BA subfolders) ──');
  console.log('');

  if (!collSectionId) {
    console.log('  Section not found, skipping');
    console.log('');
  } else {
    console.log('  Reading source data...');
    const sourceRecords = await readSourceRecords();
    const expectedCollections = buildExpectedCollections(sourceRecords.productRecords, sourceRecords.collectionRecords);
    console.log(`  Expected collections: ${expectedCollections.length}`);
    console.log('');

    if (expectedCollections.length > 0) {
      const collResult = await restructureCollectionFolders(drive, collSectionId, expectedCollections, dryRun);

      for (const name of collResult.baFoldersCreated) {
        console.log(`  + BA folder: ${name}`);
        stepResults.collBaFoldersCreated++;
      }

      for (const m of collResult.collectionsMoved) {
        console.log(`  → ${m.name} (${m.from} → ${m.to})`);
        stepResults.collMoved++;
      }

      for (const name of collResult.collectionsCreated) {
        console.log(`  + ${name}`);
        stepResults.collCreated++;
      }

      for (const w of collResult.warnings) {
        console.log(`  ⚠ ${w}`);
        stepResults.collWarnings++;
      }

      for (const e of collResult.errors) {
        console.log(`  ✗ ${e}`);
        stepResults.collErrors++;
      }

      if (collResult.baFoldersCreated.length === 0 &&
          collResult.collectionsMoved.length === 0 &&
          collResult.collectionsCreated.length === 0 &&
          collResult.errors.length === 0) {
        console.log('  All collections already in correct BA subfolders.');
      }
    }
    console.log('');
  }

  // ── Product Images: migrate flat folders into BA subfolders ──
  console.log('── Product Images: migrate flat folders ──');
  console.log('');

  if (!prodSectionId) {
    console.log('  Section not found, skipping');
    console.log('');
  } else {
    console.log('  Reading product mapping...');
    const prodResult = await migrateFlatProductFolders(drive, prodSectionId, dryRun);
    console.log('');

    if (prodResult.moves.length > 0) {
      console.log('  Move:');
      for (const m of prodResult.moves) {
        console.log(`    Product Images/${m.name} → Product Images/${m.baName}/${m.name}`);
        stepResults.prodMoved++;
      }
      console.log('');
    }

    if (prodResult.conflicts.length > 0) {
      console.log('  ⚠ Conflicts:');
      for (const c of prodResult.conflicts) {
        console.log(`    ${c.name}: ${c.details}`);
        stepResults.prodConflicts++;
      }
      console.log('');
    }

    if (prodResult.alreadyThere.length > 0) {
      console.log('  Already in correct BA folder:');
      for (const a of prodResult.alreadyThere) {
        console.log(`    ${a.name} → ${a.baName}`);
        stepResults.prodAlreadyThere++;
      }
      console.log('');
    }

    if (prodResult.notFound.length > 0) {
      console.log('  ⚠ No product mapping (skipped):');
      for (const n of prodResult.notFound) {
        console.log(`    ${n.name}: ${n.details}`);
        stepResults.prodNotFound++;
      }
      console.log('');
    }

    for (const e of prodResult.errors) {
      console.log(`  ✗ ${e}`);
      stepResults.prodErrors++;
    }

    if (!dryRun) {
      await validateProductStructure(drive, prodSectionId);
    }
    console.log('');
  }

  console.log('── Summary ──');
  console.log('');
  console.log(`  BA files moved:            ${stepResults.baFilesMoved}`);
  console.log(`  BA folders removed:        ${stepResults.baFoldersDeleted}`);
  console.log(`  BA subfolders created:     ${stepResults.collBaFoldersCreated}`);
  console.log(`  Collections moved:         ${stepResults.collMoved}`);
  console.log(`  Collections created:       ${stepResults.collCreated}`);
  console.log(`  Products moved to BA:      ${stepResults.prodMoved}`);
  console.log(`  Products already there:    ${stepResults.prodAlreadyThere}`);
  console.log(`  Product conflicts:         ${stepResults.prodConflicts}`);
  console.log(`  Product no mapping:        ${stepResults.prodNotFound}`);
  console.log(`  Conflicts/Warnings:        ${stepResults.baConflicts + stepResults.baWarnings + stepResults.collWarnings}`);
  console.log(`  Errors:                    ${stepResults.collErrors + stepResults.prodErrors + stepResults.errors.length}`);

  if (dryRun) {
    console.log('');
    console.log('No files changed (dry run).');
  } else {
    console.log('');
    console.log('Cleanup completed.');
  }
}

await run();
