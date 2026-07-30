/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved.
 *
 */

import type { drive_v3 } from 'googleapis';
import type { DriveItem, NameMapping, RenameOp, SectionReport } from './types.ts';

export const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';
const PRODUCT_ID_PATTERN = /^[A-Z]{2}-[A-Z]{2}-\d{3}$/;
const COLLECTION_CODE_PATTERN = /^[A-Z]{2}-[A-Z]{2}$/;
const BUSINESS_AREA_CODE_PATTERN = /^[A-Z]{2}$/;

const ALLOWED_IMAGE = /\.(jpg|jpeg|png|webp)$/i;

export async function listDriveItems(
  drive: drive_v3.Drive,
  folderId: string,
): Promise<DriveItem[]> {
  const items: DriveItem[] = [];
  let pageToken: string | undefined | null = undefined;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType, md5Checksum)',
      pageSize: 1000,
      pageToken: pageToken ?? undefined,
    });

    const files = response.data.files || [];
    for (const file of files) {
      items.push({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        md5Checksum: file.md5Checksum,
      });
    }

    pageToken = response.data.nextPageToken;
  } while (pageToken);

  return items;
}

export async function findChildFolder(
  drive: drive_v3.Drive,
  parentId: string,
  name: string,
): Promise<string | null> {
  const response = await drive.files.list({
    q: `'${parentId}' in parents and name='${name.replace(/'/g, "\\'")}' and mimeType='${DRIVE_FOLDER_MIME}' and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 10,
  });

  const files = response.data.files || [];
  return files.length > 0 ? files[0].id! : null;
}

export async function renameDriveItem(
  drive: drive_v3.Drive,
  fileId: string,
  newName: string,
): Promise<void> {
  await drive.files.update({
    fileId,
    requestBody: { name: newName },
  });
}

export async function checkNameConflict(
  drive: drive_v3.Drive,
  parentId: string,
  name: string,
): Promise<boolean> {
  const response = await drive.files.list({
    q: `'${parentId}' in parents and name='${name.replace(/'/g, "\\'")}' and trashed=false`,
    fields: 'files(id)',
    pageSize: 5,
  });

  return (response.data.files?.length ?? 0) > 0;
}

function isImageFile(item: DriveItem): boolean {
  return item.mimeType !== DRIVE_FOLDER_MIME && ALLOWED_IMAGE.test(item.name);
}

function sortImages(files: DriveItem[]): DriveItem[] {
  return files
    .filter(isImageFile)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildImageNewName(
  index: number,
  total: number,
  slug: string,
  extension: string,
): string {
  if (index === 0) {
    return `main-${slug}${extension}`;
  }
  const galleryIndex = String(index).padStart(2, '0');
  return `gallery-${galleryIndex}${extension}`;
}

async function processProductFolder(
  drive: drive_v3.Drive,
  folder: DriveItem,
  mapping: NameMapping | undefined,
  section: string,
  dryRun: boolean,
): Promise<{ ops: RenameOp[]; manifestFiles: { name: string; md5: string; primary: boolean }[] }> {
  const ops: RenameOp[] = [];
  const manifestFiles: { name: string; md5: string; primary: boolean }[] = [];

  const contents = await listDriveItems(drive, folder.id);
  const images = sortImages(contents);

  if (images.length === 0) return { ops, manifestFiles };

  const folderNewName = mapping?.name ?? folder.name;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const ext = img.name.match(/\.\w+$/)?.[0] ?? '.jpg';
    const newFileName = mapping
      ? buildImageNewName(i, images.length, mapping.slug, ext)
      : img.name;

    if (newFileName !== img.name) {
      ops.push({
        type: 'file',
        section,
        oldName: img.name,
        newName: newFileName,
        driveId: img.id,
        status: 'ready',
      });
    }

    manifestFiles.push({
      name: newFileName,
      md5: img.md5Checksum ?? '',
      primary: i === 0,
    });
  }

  if (folderNewName !== folder.name && mapping) {
    ops.push({
      type: 'folder',
      section,
      oldName: folder.name,
      newName: folderNewName,
      driveId: folder.id,
      status: 'ready',
    });
  }

  return { ops, manifestFiles };
}

async function processCollectionFolder(
  drive: drive_v3.Drive,
  folder: DriveItem,
  mapping: NameMapping | undefined,
  section: string,
  dryRun: boolean,
): Promise<{ ops: RenameOp[]; manifestFiles: { name: string; md5: string; primary: boolean }[] }> {
  return processProductFolder(drive, folder, mapping, section, dryRun);
}

async function processBusinessAreaFolder(
  drive: drive_v3.Drive,
  folder: DriveItem,
  mapping: NameMapping | undefined,
  section: string,
  dryRun: boolean,
): Promise<{ ops: RenameOp[]; manifestFiles: { name: string; md5: string; primary: boolean }[] }> {
  return processProductFolder(drive, folder, mapping, section, dryRun);
}

export async function buildRenamePlan(
  drive: drive_v3.Drive,
  sectionId: string,
  sectionLabel: string,
  sectionType: 'product-images' | 'collection-images' | 'business-area-images',
  mappings: Map<string, NameMapping>,
  dryRun: boolean,
): Promise<{
  report: SectionReport;
  manifestEntries: { code: string; folder: string; files: { name: string; md5: string; primary: boolean }[] }[];
}> {
  const ops: RenameOp[] = [];
  const manifestEntries: { code: string; folder: string; files: { name: string; md5: string; primary: boolean }[] }[] = [];

  if (sectionType === 'product-images') {
    const allFolders: DriveItem[] = [];
    const queue = [sectionId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await listDriveItems(drive, currentId);
      for (const child of children) {
        if (child.mimeType === DRIVE_FOLDER_MIME) {
          allFolders.push(child);
          queue.push(child.id);
        }
      }
    }

    const productFolders = allFolders.filter((f) => PRODUCT_ID_PATTERN.test(f.name));

    for (const folder of productFolders) {
      const mapping = mappings.get(folder.name);
      if (!mapping) {
        console.log(`  ⚠ ${folder.name}: no product mapping found (skipping)`);
        continue;
      }
      const result = await processProductFolder(drive, folder, mapping, sectionLabel, dryRun);
      ops.push(...result.ops);

      manifestEntries.push({
        code: folder.name,
        folder: mapping.name,
        files: result.manifestFiles,
      });
    }
  }

  if (sectionType === 'collection-images') {
    const subfolders = await listDriveItems(drive, sectionId);
    const collectionFolders = subfolders.filter(
      (f) => f.mimeType === DRIVE_FOLDER_MIME && COLLECTION_CODE_PATTERN.test(f.name),
    );

    for (const folder of collectionFolders) {
      const mapping = mappings.get(folder.name);
      if (!mapping) {
        console.log(`  ⚠ ${folder.name}: no collection mapping found (skipping)`);
        continue;
      }
      const result = await processCollectionFolder(drive, folder, mapping, sectionLabel, dryRun);
      ops.push(...result.ops);

      manifestEntries.push({
        code: folder.name,
        folder: mapping.name,
        files: result.manifestFiles,
      });
    }
  }

  if (sectionType === 'business-area-images') {
    const areas = await listDriveItems(drive, sectionId);
    for (const area of areas) {
      if (area.mimeType !== DRIVE_FOLDER_MIME) continue;

      const innerItems = await listDriveItems(drive, area.id);
      const innerCodeFolder = innerItems.find(
        (i) => i.mimeType === DRIVE_FOLDER_MIME && BUSINESS_AREA_CODE_PATTERN.test(i.name),
      );

      const targetFolder = innerCodeFolder ?? area;
      const folderCode = innerCodeFolder
        ? innerCodeFolder.name
        : area.name.substring(0, 2);
      const mapping = mappings.get(folderCode);

      if (!mapping) {
        console.log(`  ⚠ ${area.name}/${folderCode}: no business area mapping found (skipping)`);
        continue;
      }
      const result = await processBusinessAreaFolder(drive, targetFolder, mapping, sectionLabel, dryRun);
      ops.push(...result.ops);

      manifestEntries.push({
        code: folderCode,
        folder: mapping.name,
        files: result.manifestFiles,
      });
    }
  }

  const foldersRenamed = ops.filter((o) => o.type === 'folder' && o.status === 'ready').length;
  const filesRenamed = ops.filter((o) => o.type === 'file' && o.status === 'ready').length;

  const report: SectionReport = {
    section: sectionLabel,
    foldersRenamed,
    filesRenamed,
    conflicts: 0,
    errors: 0,
    skipped: 0,
    ops,
  };

  return { report, manifestEntries };
}

export async function getDriveItemParent(
  drive: drive_v3.Drive,
  fileId: string,
): Promise<string | null> {
  try {
    const response = await drive.files.get({
      fileId,
      fields: 'parents',
    });
    const parents = response.data.parents;
    return parents && parents.length > 0 ? parents[0] : null;
  } catch {
    return null;
  }
}
