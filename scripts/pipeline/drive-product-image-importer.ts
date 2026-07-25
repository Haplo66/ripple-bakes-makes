import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { authenticateDrive } from './drive-auth.ts';
import { IMAGE_DIR } from './constants.ts';
import type { drive_v3 } from 'googleapis';

const PRODUCT_ID_PATTERN = /^[A-Z]{2}-[A-Z]{2}-\d{3}$/;
const ALLOWED_IMAGE = /\.(jpg|jpeg|png|webp)$/i;
const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';

const HEADER = 'RIPPLE Drive Asset Import';
const DRIVE_LABEL = 'Product Images';

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  md5Checksum?: string | null;
}

interface ProductImageFolder {
  id: string;
  name: string;
  images: DriveItem[];
}

function isDryRun(): boolean {
  return process.argv.includes('--dry-run');
}

function isProductId(name: string): boolean {
  return PRODUCT_ID_PATTERN.test(name);
}

function isImageFile(item: DriveItem): boolean {
  return item.mimeType !== DRIVE_FOLDER_MIME && ALLOWED_IMAGE.test(item.name);
}

async function listAll(
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

async function findChildFolder(
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

async function findAllFoldersRecursive(
  drive: drive_v3.Drive,
  rootId: string,
): Promise<DriveItem[]> {
  const all: DriveItem[] = [];
  const queue = [rootId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = await listAll(drive, currentId);

    for (const child of children) {
      if (child.mimeType === DRIVE_FOLDER_MIME) {
        all.push(child);
        queue.push(child.id);
      }
    }
  }

  return all;
}

function computeFileMd5(filePath: string): string | null {
  try {
    const buffer = readFileSync(filePath);
    return createHash('md5').update(buffer).digest('hex');
  } catch {
    return null;
  }
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

async function run(): Promise<void> {
  const dryRun = isDryRun();
  let warnings: string[] = [];

  console.log(HEADER);
  console.log('');

  const folderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  if (!folderId) {
    console.error(
      'Missing GOOGLE_DRIVE_ROOT_FOLDER_ID environment variable.\n' +
      'Set it to the ID of the Product Images folder in Google Drive.',
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

  console.log('Scanning product folders...');
  console.log('');

  const allFolders = await findAllFoldersRecursive(drive, folderId);
  const productFolders: DriveItem[] = allFolders.filter((f) =>
    isProductId(f.name),
  );

  if (productFolders.length === 0) {
    console.log('No product folders found.');
    console.log('');
    console.log('No files changed.');
    process.exit(0);
  }

  const productImageFolders: ProductImageFolder[] = [];

  for (const pf of productFolders) {
    const files = await listAll(drive, pf.id);
    const images = files.filter(isImageFile);
    productImageFolders.push({ id: pf.id, name: pf.name, images });
  }

  const sorted = productImageFolders.sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  console.log(`Found ${sorted.length} product(s):`);
  console.log('');

  for (const p of sorted) {
    console.log(`  ${p.name}`);
    console.log(`    Images: ${p.images.length}   Target: public/images/products/${p.name}/`);
  }

  console.log('');

  if (dryRun) {
    console.log('No files changed (dry run).');
    process.exit(0);
  }

  let downloaded = 0;
  let skipped = 0;
  let replaced = 0;
  let failed: string[] = [];

  for (const p of sorted) {
    const targetDir = join(IMAGE_DIR, 'products', p.name);
    mkdirSync(targetDir, { recursive: true });

    for (const img of p.images) {
      const targetFile = join(targetDir, img.name);
      const driveMd5 = img.md5Checksum || '';

      if (existsSync(targetFile)) {
        const localMd5 = computeFileMd5(targetFile);

        if (localMd5 === driveMd5) {
          skipped += 1;
          continue;
        }

        replaced += 1;
      } else {
        downloaded += 1;
      }

      try {
        await downloadFile(drive, img.id, targetFile);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failed.push(`${p.name}/${img.name}: ${message}`);
      }
    }
  }

  console.log(`Downloaded: ${downloaded}`);
  console.log(`Replaced:  ${replaced}`);
  console.log(`Skipped:   ${skipped}`);

  if (failed.length > 0) {
    console.log('');
    console.log(`Failed:    ${failed.length}`);
    for (const f of failed) {
      console.warn(`  ! ${f}`);
    }
  }

  if (warnings.length > 0) {
    console.log('');
    console.log(`Warnings: ${warnings.length}`);
    for (const w of warnings) {
      console.warn(`  ! ${w}`);
    }
  }

  console.log('');
  console.log('Import completed.');
}

await run();
