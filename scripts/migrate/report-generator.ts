/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECT_ROOT } from '../pipeline/constants.ts';
import type { MigrationReport, SectionReport, AssetManifest, ManifestEntry, RenameOp } from './types.ts';

const OUTPUT_DIR = join(PROJECT_ROOT, 'data', 'manifest');

export function generateReport(
  sections: SectionReport[],
  dryRun: boolean,
): MigrationReport {
  let totalFolders = 0;
  let totalFiles = 0;
  let renamed = 0;
  let conflicts = 0;
  let errors = 0;
  let skipped = 0;

  for (const section of sections) {
    for (const op of section.ops) {
      if (op.type === 'folder') totalFolders++;
      if (op.type === 'file') totalFiles++;
      if (op.status === 'renamed') renamed++;
      if (op.status === 'conflict') conflicts++;
      if (op.status === 'error') errors++;
      if (op.status === 'skipped') skipped++;
    }

    section.foldersRenamed = section.ops.filter(
      (o) => o.type === 'folder' && o.status === 'renamed',
    ).length;
    section.filesRenamed = section.ops.filter(
      (o) => o.type === 'file' && o.status === 'renamed',
    ).length;
    section.conflicts = section.ops.filter((o) => o.status === 'conflict').length;
    section.errors = section.ops.filter((o) => o.status === 'error').length;
    section.skipped = section.ops.filter((o) => o.status === 'skipped').length;
  }

  return {
    generatedAt: new Date().toISOString(),
    dryRun,
    sections,
    summary: { totalFolders, totalFiles, renamed, conflicts, errors, skipped },
  };
}

export function printReport(report: MigrationReport): void {
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('  Migration Report');
  console.log('═══════════════════════════════════════');
  console.log('');

  for (const section of report.sections) {
    console.log(`── ${section.section} ──`);
    console.log(`  Folders to rename: ${section.ops.filter((o) => o.type === 'folder').length}`);
    console.log(`  Files to rename:   ${section.ops.filter((o) => o.type === 'file').length}`);

    if (section.ops.length === 0) {
      console.log('  (no changes)');
      console.log('');
      continue;
    }

    const folderOps = section.ops.filter((o) => o.type === 'folder');
    for (const op of folderOps) {
      const statusIcon = op.status === 'renamed' ? '✓' : op.status === 'conflict' ? '✗' : op.status === 'error' ? '!' : '→';
      console.log(`  ${statusIcon} Folder: ${op.oldName} → ${op.newName}  [${op.status}]`);
      if (op.error) console.log(`    ${op.error}`);
    }

    const fileOps = section.ops.filter((o) => o.type === 'file');
    const groupedByFolder = new Map<string, RenameOp[]>();
    for (const op of fileOps) {
      const key = op.section;
      if (!groupedByFolder.has(key)) groupedByFolder.set(key, []);
      groupedByFolder.get(key)!.push(op);
    }

    for (const [, fileGroup] of groupedByFolder) {
      for (const op of fileGroup) {
        const statusIcon = op.status === 'renamed' ? '✓' : op.status === 'conflict' ? '✗' : op.status === 'error' ? '!' : '→';
        console.log(`  ${statusIcon} ${op.oldName} → ${op.newName}  [${op.status}]`);
        if (op.error) console.log(`    ${op.error}`);
      }
    }
    console.log('');
  }

  console.log('── Summary ──');
  console.log(`  Total folders:     ${report.summary.totalFolders}`);
  console.log(`  Total files:       ${report.summary.totalFiles}`);
  console.log(`  Renamed:           ${report.summary.renamed}`);
  console.log(`  Conflicts:         ${report.summary.conflicts}`);
  console.log(`  Errors:            ${report.summary.errors}`);
  console.log(`  Skipped:           ${report.summary.skipped}`);
  console.log('');

  if (report.dryRun) {
    console.log('No changes were made (dry run).');
    console.log('Run with --execute to apply changes.');
  }
}

export function saveReport(report: MigrationReport): void {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const filePath = join(OUTPUT_DIR, 'migration-report.json');
  writeFileSync(filePath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Report saved to data/manifest/migration-report.json`);
}

export function generateAssetManifest(
  products: ManifestEntry[],
  collections: ManifestEntry[],
  businessAreas: ManifestEntry[],
): AssetManifest {
  return {
    _metadata: {
      version: 1,
      generatedAt: new Date().toISOString(),
      tool: 'RIPPLE Drive Name Migration',
    },
    products,
    collections,
    businessAreas,
  };
}

export function saveAssetManifest(manifest: AssetManifest): void {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const filePath = join(OUTPUT_DIR, 'images.json');
  writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Asset manifest saved to data/manifest/images.json`);
}
