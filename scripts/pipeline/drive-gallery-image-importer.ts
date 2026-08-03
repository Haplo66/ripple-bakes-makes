/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { drive_v3 } from 'googleapis';
import { authenticateDrive } from './drive-auth.ts';
import { IMAGE_DIR } from './constants.ts';

const ALLOWED_IMAGE = /\.(jpg|jpeg|png|webp)$/i;
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const HEADER = 'RIPPLE Gallery Image Import';

async function listAll(
  drive: drive_v3.Drive,
  folderId: string,
): Promise<{ id: string; name: string; mimeType: string }[]> {
  const items: { id: string; name: string; mimeType: string }[] = [];
  let pageToken: string | undefined | null = undefined;

  do {
    const response: { data: drive_v3.Schema$FileList } = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType)',
      pageSize: 1000,
      pageToken: pageToken ?? undefined,
    });
    const files = response.data.files || [];
    for (const file of files) {
      items.push({ id: file.id!, name: file.name!, mimeType: file.mimeType! });
    }
    pageToken = response.data.nextPageToken;
  } while (pageToken);

  return items;
}

async function findChildFolder(
  drive: drive_v3.Drive,
  parentId: string,
  name: string,
): Promise<string | null> {
  const response = await drive.files.list({
    q: `'${parentId}' in parents and name='${name.replace(/'/g, "\\'")}' and mimeType='${FOLDER_MIME}' and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 10,
  });
  const files = response.data.files || [];
  return files.length > 0 ? files[0].id! : null;
}

async function downloadFile(
  drive: drive_v3.Drive,
  fileId: string,
  targetPath: string,
): Promise<void> {
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' },
  );
  const writeStream = createWriteStream(targetPath);
  await pipeline(response.data, writeStream);
}

async function downloadGalleryImage(
  drive: drive_v3.Drive,
  fileId: string,
  targetFile: string,
): Promise<'downloaded' | 'skipped'> {
  if (existsSync(targetFile)) return 'skipped';
  try {
    await downloadFile(drive, fileId, targetFile);
    return 'downloaded';
  } catch {
    return 'skipped';
  }
}

async function importCategory(
  drive: drive_v3.Drive,
  folderId: string,
  category: string,
  dryRun: boolean,
): Promise<number> {
  const files = await listAll(drive, folderId);
  const images = files.filter((f) => f.mimeType !== FOLDER_MIME && ALLOWED_IMAGE.test(f.name));
  if (images.length === 0) return 0;

  const targetDir = join(IMAGE_DIR, 'gallery', category);
  console.log(`  ${category}: ${images.length} file(s) → public/images/gallery/${category}/`);

  if (dryRun) return images.length;

  mkdirSync(targetDir, { recursive: true });

  let count = 0;
  for (const img of images) {
    const targetFile = join(targetDir, img.name);
    const result = await downloadGalleryImage(drive, img.id, targetFile);
    if (result === 'downloaded') count += 1;
  }

  return count;
}

async function run(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  console.log(HEADER);
  console.log('');

  const folderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!folderId) {
    console.error(
      'Missing GOOGLE_DRIVE_ROOT_FOLDER_ID environment variable.\n' +
      'Set it to the ID of the RIPPLE Business Data folder in Google Drive.',
    );
    process.exit(1);
  }

  console.log('Connecting to Google Drive...');
  let drive: drive_v3.Drive;
  try {
    drive = await authenticateDrive();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Authentication failed: ${message}`);
    process.exit(1);
  }

  console.log('');

  // Resolve Assets/Gallery Images folder
  const rootChildren = await listAll(drive, folderId);
  const assetsFolderId = await findChildFolder(drive, folderId, 'Assets');
  if (!assetsFolderId) {
    console.log('Assets folder not found under root. Skipping gallery import.');
    return;
  }

  const gallerySectionId = await findChildFolder(drive, assetsFolderId, 'Gallery Images');
  if (!gallerySectionId) {
    console.log('"Gallery Images" folder not found under Assets. Skipping gallery import.');
    return;
  }

  // Scan subfolders (Personal, Bakery, Sewing)
  const categories = await listAll(drive, gallerySectionId);
  const subfolders = categories.filter((f) => f.mimeType === FOLDER_MIME);

  if (subfolders.length === 0) {
    console.log('No subfolders found in Gallery Images. Skipping.');
    return;
  }

  console.log('Scanning gallery categories...');
  console.log('');

  let totalDownloaded = 0;

  for (const folder of subfolders) {
    const category = folder.name.toLowerCase();
    const count = await importCategory(drive, folder.id, category, dryRun);
    totalDownloaded += count;
  }

  console.log('');
  if (dryRun) {
    console.log(`Found ${totalDownloaded} gallery image(s) (dry run, no files changed).`);
  } else {
    console.log(`Downloaded ${totalDownloaded} new gallery image(s).`);
  }

  if (dryRun) {
    console.log('No files changed (dry run).');
  }

  console.log('');
  console.log('Gallery import completed.');
}

await run();
