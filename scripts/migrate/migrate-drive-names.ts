/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { authenticateDrive } from '../pipeline/drive-auth.ts';
import { buildNameMappings } from './name-mapper.ts';
import {
  buildRenamePlan,
  checkNameConflict,
  findChildFolder,
  getDriveItemParent,
  renameDriveItem,
} from './drive-renamer.ts';
import {
  generateReport,
  printReport,
  saveReport,
  generateAssetManifest,
  saveAssetManifest,
} from './report-generator.ts';
import type { SectionReport, ManifestEntry } from './types.ts';

const HEADER = 'RIPPLE Drive Name Migration';

interface CliOptions {
  dryRun: boolean;
  verbose: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv;
  return {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
  };
}

async function resolveAssetsRoot(
  drive: Awaited<ReturnType<typeof authenticateDrive>>,
  rootId: string,
): Promise<string> {
  const assetsId = await findChildFolder(drive, rootId, 'Assets');
  if (!assetsId) {
    throw new Error('Could not find "Assets" folder under the root.');
  }
  return assetsId;
}

async function run(): Promise<void> {
  const { dryRun, verbose } = parseArgs();

  if (!dryRun && !process.argv.includes('--execute')) {
    console.error('Usage: node migrate-drive-names.ts --dry-run | --execute');
    console.error('  --dry-run    Preview changes without modifying Drive');
    console.error('  --execute    Apply the migration to Drive');
    process.exit(1);
  }

  console.log(HEADER);
  console.log(dryRun ? 'Mode: DRY RUN (no changes)' : 'Mode: EXECUTE');
  console.log('');

  const folderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!folderId) {
    console.error(
      'Missing GOOGLE_DRIVE_ROOT_FOLDER_ID environment variable.',
    );
    process.exit(1);
  }

  console.log('Step 1: Connecting to Google Drive...');
  let drive: Awaited<ReturnType<typeof authenticateDrive>>;
  try {
    drive = await authenticateDrive(true);
    console.log('  Drive connected');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  Authentication failed: ${message}`);
    process.exit(1);
  }
  console.log('');

  console.log('Step 2: Reading name mappings from Google Sheets...');
  let mappings: Awaited<ReturnType<typeof buildNameMappings>>;
  try {
    mappings = await buildNameMappings();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  Failed to build name mappings: ${message}`);
    process.exit(1);
  }
  console.log('');

  console.log('Step 3: Locating Assets folder...');
  let assetsId: string;
  try {
    assetsId = await resolveAssetsRoot(drive, folderId);
    console.log('  Assets folder found');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  Failed to locate Assets: ${message}`);
    process.exit(1);
  }
  console.log('');

  const sections = [
    { label: 'Product Images', type: 'product-images' as const },
    { label: 'Collection Images', type: 'collection-images' as const },
    { label: 'Business Area Images', type: 'business-area-images' as const },
  ];

  const sectionReports: SectionReport[] = [];
  const allProductEntries: ManifestEntry[] = [];
  const allCollectionEntries: ManifestEntry[] = [];
  const allBusinessAreaEntries: ManifestEntry[] = [];

  console.log('Step 4: Building rename plans...');
  console.log('');

  for (const section of sections) {
    console.log(`── ${section.label} ──`);

    const sectionId = await findChildFolder(drive, assetsId, section.label);
    if (!sectionId) {
      console.log(`  (section folder not found, skipping)`);
      console.log('');
      continue;
    }

    let nameMappings: Map<string, import('./types.ts').NameMapping>;
    if (section.type === 'product-images') {
      nameMappings = mappings.products;
    } else if (section.type === 'collection-images') {
      nameMappings = mappings.collections;
    } else {
      nameMappings = mappings.businessAreas;
    }

    const { report, manifestEntries } = await buildRenamePlan(
      drive,
      sectionId,
      section.label,
      section.type,
      nameMappings,
      dryRun,
    );

    sectionReports.push(report);

    if (section.type === 'product-images') {
      allProductEntries.push(...manifestEntries);
    } else if (section.type === 'collection-images') {
      allCollectionEntries.push(...manifestEntries);
    } else {
      allBusinessAreaEntries.push(...manifestEntries);
    }

    console.log(`  Folders found: ${report.ops.filter((o) => o.type === 'folder').length}`);
    console.log(`  Files found:   ${report.ops.filter((o) => o.type === 'file').length}`);

    if (report.ops.length > 0 && verbose) {
      for (const op of report.ops) {
        const statusIcon = op.status === 'ready' ? '→' : op.status === 'renamed' ? '✓' : '✗';
        const typeLabel = op.type === 'folder' ? 'Folder' : 'File';
        console.log(`  ${statusIcon} [${typeLabel}] ${op.oldName} → ${op.newName}`);
      }
    }
    console.log('');
  }

  if (!dryRun) {
    console.log('Step 5: Executing renames...');
    console.log('');

    for (const report of sectionReports) {
      console.log(`── ${report.section} ──`);

      const readyOps = report.ops.filter((o) => o.status === 'ready');
      if (readyOps.length === 0) {
        console.log('  No pending renames');
        console.log('');
        continue;
      }

      const fileOps = readyOps.filter((o) => o.type === 'file');
      const folderOps = readyOps.filter((o) => o.type === 'folder');

      if (fileOps.length > 0) {
        console.log(`  Renaming ${fileOps.length} file(s)...`);
        for (const op of fileOps) {
          try {
            const parentId = await getDriveItemParent(drive, op.driveId);
            if (!parentId) {
              op.status = 'error';
              op.error = 'Could not determine parent folder';
              report.errors++;
              console.log(`  ✗ ${op.oldName} → ${op.newName} [ERROR: no parent]`);
              continue;
            }

            const conflict = await checkNameConflict(drive, parentId, op.newName);
            if (conflict) {
              op.status = 'conflict';
              op.error = `Target "${op.newName}" already exists in parent`;
              report.conflicts++;
              console.log(`  ✗ ${op.oldName} → ${op.newName} [CONFLICT]`);
              continue;
            }

            await renameDriveItem(drive, op.driveId, op.newName);
            op.status = 'renamed';
            console.log(`  ✓ ${op.oldName} → ${op.newName}`);
          } catch (error) {
            op.status = 'error';
            op.error = error instanceof Error ? error.message : String(error);
            report.errors++;
            console.log(`  ✗ ${op.oldName} → ${op.newName} [ERROR: ${op.error}]`);
          }
        }
      }

      if (folderOps.length > 0) {
        console.log(`  Renaming ${folderOps.length} folder(s)...`);
        for (const op of folderOps) {
          try {
            const parentId = await getDriveItemParent(drive, op.driveId);
            if (!parentId) {
              op.status = 'error';
              op.error = 'Could not determine parent folder';
              report.errors++;
              console.log(`  ✗ ${op.oldName} → ${op.newName} [ERROR: no parent]`);
              continue;
            }

            const conflict = await checkNameConflict(drive, parentId, op.newName);
            if (conflict) {
              op.status = 'conflict';
              op.error = `Target folder "${op.newName}" already exists in parent`;
              report.conflicts++;
              console.log(`  ✗ ${op.oldName} → ${op.newName} [CONFLICT]`);
              continue;
            }

            await renameDriveItem(drive, op.driveId, op.newName);
            op.status = 'renamed';
            console.log(`  ✓ ${op.oldName} → ${op.newName}`);
          } catch (error) {
            op.status = 'error';
            op.error = error instanceof Error ? error.message : String(error);
            report.errors++;
            console.log(`  ✗ ${op.oldName} → ${op.newName} [ERROR: ${op.error}]`);
          }
        }
      }
      console.log('');
    }
  }

  console.log('Step 6: Generating report...');
  const report = generateReport(sectionReports, dryRun);
  printReport(report);
  saveReport(report);

  if (!dryRun) {
    console.log('Step 7: Generating asset manifest...');
    const manifest = generateAssetManifest(
      allProductEntries,
      allCollectionEntries,
      allBusinessAreaEntries,
    );
    saveAssetManifest(manifest);
  }

  if (dryRun) {
    console.log('Dry run complete. No changes were made.');
    console.log('Review the report above, then run with --execute to apply.');
  } else {
    console.log('Migration complete.');
  }
}

await run();
