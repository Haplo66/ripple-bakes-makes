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

interface AssetSection {
  label: string;
  type: 'product-images' | 'homepage-images' | 'business-area-images' | 'flat-files' | 'favicon' | 'collection-images';
}

const SECTIONS: AssetSection[] = [
  { label: 'Product Images', type: 'product-images' },
  { label: 'Collection Images', type: 'collection-images' },
  { label: 'Homepage Images', type: 'homepage-images' },
  { label: 'Business Area Images', type: 'business-area-images' },
  { label: 'Logo and Symbol', type: 'flat-files' },
  { label: 'Favicon', type: 'favicon' },
];

const BUSINESS_AREA_CODE: Record<string, string> = {
  Bakery: 'BK',
  Sewing: 'SW',
};

const FLAT_TARGET: Record<string, string> = {
  'Collection Images': 'collections',
  'Logo and Symbol': 'logo',
};

function isDryRun(): boolean {
  return process.argv.includes('--dry-run');
}

function isDebugTree(): boolean {
  return process.argv.includes('--debug-tree');
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

async function resolveAssetsRoot(
  drive: drive_v3.Drive,
  rootId: string,
): Promise<string> {
  const children = await listAll(drive, rootId);
  const folders = children.filter((c) => c.mimeType === DRIVE_FOLDER_MIME);
  console.log('Children found under root:');
  for (const f of folders) {
    console.log(`  - ${f.name}`);
  }
  console.log('');

  const assetsId = await findChildFolder(drive, rootId, 'Assets');
  if (!assetsId) {
    throw new Error('Could not find "Assets" folder under the root.');
  }
  return assetsId;
}

async function printTree(
  drive: drive_v3.Drive,
  folderId: string,
  prefix: string = '',
): Promise<void> {
  const items = await listAll(drive, folderId);
  const folders = items
    .filter((i) => i.mimeType === DRIVE_FOLDER_MIME)
    .sort((a, b) => a.name.localeCompare(b.name));
  const files = items
    .filter((i) => i.mimeType !== DRIVE_FOLDER_MIME && ALLOWED_IMAGE.test(i.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  const allEntries = [...folders, ...files];

  for (let i = 0; i < allEntries.length; i++) {
    const entry = allEntries[i];
    const isLast = i === allEntries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    console.log(`${prefix}${connector}${entry.name}`);

    if (entry.mimeType === DRIVE_FOLDER_MIME) {
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      await printTree(drive, entry.id, childPrefix);
    }
  }
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

async function downloadWithCheck(
  drive: drive_v3.Drive,
  file: DriveItem,
  targetFile: string,
): Promise<'downloaded' | 'skipped' | 'replaced' | 'failed'> {
  const driveMd5 = file.md5Checksum || '';

  if (existsSync(targetFile)) {
    const localMd5 = computeFileMd5(targetFile);
    if (localMd5 === driveMd5) {
      return 'skipped';
    }
    try {
      await downloadFile(drive, file.id, targetFile);
      return 'replaced';
    } catch {
      return 'failed';
    }
  }

  try {
    await downloadFile(drive, file.id, targetFile);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}

async function importProductImages(
  drive: drive_v3.Drive,
  sectionId: string,
  dryRun: boolean,
): Promise<{ items: number; downloaded: number; replaced: number; skipped: number; failed: number }> {
  const allFolders: DriveItem[] = [];
  const queue = [sectionId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = await listAll(drive, currentId);
    for (const child of children) {
      if (child.mimeType === DRIVE_FOLDER_MIME) {
        allFolders.push(child);
        queue.push(child.id);
      }
    }
  }

  const productFolders = allFolders.filter((f) => isProductId(f.name));

  if (productFolders.length === 0) {
    console.log('  No product folders found.');
    return { items: 0, downloaded: 0, replaced: 0, skipped: 0, failed: 0 };
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

  console.log(`  ${sorted.length} product folder(s)`);

  let downloaded = 0;
  let replaced = 0;
  let skipped = 0;
  let failed = 0;

  for (const p of sorted) {
    const targetDir = join(IMAGE_DIR, 'products', p.name);
    console.log(`  ${p.name}`);
    console.log(`    Images: ${p.images.length}   Target: public/images/products/${p.name}/`);

    if (dryRun) continue;

    mkdirSync(targetDir, { recursive: true });

    for (const img of p.images) {
      const targetFile = join(targetDir, img.name);
      const result = await downloadWithCheck(drive, img, targetFile);
      switch (result) {
        case 'downloaded': downloaded += 1; break;
        case 'replaced': replaced += 1; break;
        case 'skipped': skipped += 1; break;
        case 'failed': failed += 1; break;
      }
    }
  }

  return { items: sorted.length, downloaded, replaced, skipped, failed };
}

async function importFlatSection(
  drive: drive_v3.Drive,
  sectionId: string,
  targetDir: string,
  label: string,
  dryRun: boolean,
): Promise<{ items: number; downloaded: number; replaced: number; skipped: number; failed: number }> {
  const files = await listAll(drive, sectionId);
  const images = files.filter(isImageFile);

  if (images.length === 0) return { items: 0, downloaded: 0, replaced: 0, skipped: 0, failed: 0 };

  const absDir = targetDir ? join(IMAGE_DIR, targetDir) : '';
  console.log(`  ${label}: ${images.length} file(s)`);

  if (dryRun) {
    for (const img of images) {
      const relative = absDir ? `${targetDir}/${img.name}` : img.name;
      console.log(`    → ${relative}`);
    }
    return { items: images.length, downloaded: 0, replaced: 0, skipped: 0, failed: 0 };
  }

  if (absDir) mkdirSync(absDir, { recursive: true });

  let downloaded = 0;
  let replaced = 0;
  let skipped = 0;
  let failed = 0;

  for (const img of images) {
    const targetFile = absDir ? join(absDir, img.name) : img.name;
    const result = await downloadWithCheck(drive, img, targetFile);
    switch (result) {
      case 'downloaded': downloaded += 1; break;
      case 'replaced': replaced += 1; break;
      case 'skipped': skipped += 1; break;
      case 'failed': failed += 1; break;
    }
  }

  return { items: images.length, downloaded, replaced, skipped, failed };
}

async function importCollectionImages(
  drive: drive_v3.Drive,
  sectionId: string,
  dryRun: boolean,
): Promise<{ items: number; downloaded: number; replaced: number; skipped: number; failed: number }> {
  const subfolders = await listAll(drive, sectionId);
  let total = { items: 0, downloaded: 0, replaced: 0, skipped: 0, failed: 0 };

  for (const sub of subfolders) {
    if (sub.mimeType !== DRIVE_FOLDER_MIME) continue;
    const targetDir = `collections/${sub.name}`;
    const result = await importFlatSection(drive, sub.id, targetDir, `Collections/${sub.name}`, dryRun);
    total.items += result.items;
    total.downloaded += result.downloaded;
    total.replaced += result.replaced;
    total.skipped += result.skipped;
    total.failed += result.failed;
  }

  return total;
}

async function importHomepageImages(
  drive: drive_v3.Drive,
  sectionId: string,
  dryRun: boolean,
): Promise<{ items: number; downloaded: number; replaced: number; skipped: number; failed: number }> {
  const subfolders = await listAll(drive, sectionId);
  const folders = subfolders.filter((s) => s.mimeType === DRIVE_FOLDER_MIME);
  console.log(`  Homepage Images: ${folders.length} subfolder(s)`);
  let total = { items: 0, downloaded: 0, replaced: 0, skipped: 0, failed: 0 };

  for (const sub of folders) {
    const targetDir = `home/${sub.name}`;
    const result = await importFlatSection(drive, sub.id, targetDir, `Homepage/${sub.name}`, dryRun);
    total.items += result.items;
    total.downloaded += result.downloaded;
    total.replaced += result.replaced;
    total.skipped += result.skipped;
    total.failed += result.failed;
  }

  return total;
}

async function importBusinessAreaImages(
  drive: drive_v3.Drive,
  sectionId: string,
  dryRun: boolean,
): Promise<{ items: number; downloaded: number; replaced: number; skipped: number; failed: number }> {
  const areas = await listAll(drive, sectionId);
  let total = { items: 0, downloaded: 0, replaced: 0, skipped: 0, failed: 0 };

  for (const area of areas) {
    if (area.mimeType !== DRIVE_FOLDER_MIME) continue;
    const code = BUSINESS_AREA_CODE[area.name];
    if (!code) {
      console.log(`  ${area.name}: unknown area, skipping`);
      continue;
    }
    const targetDir = `business-areas/${code}`;
    const label = `${area.name} → ${code}`;

    const innerFolderId = await findChildFolder(drive, area.id, code);
    const scanFolderId = innerFolderId || area.id;
    const scanLabel = innerFolderId ? `${label}/${code}` : label;

    const result = await importFlatSection(drive, scanFolderId, targetDir, scanLabel, dryRun);
    total.items += result.items;
    total.downloaded += result.downloaded;
    total.replaced += result.replaced;
    total.skipped += result.skipped;
    total.failed += result.failed;
  }

  return total;
}

async function importFavicon(
  drive: drive_v3.Drive,
  sectionId: string,
  dryRun: boolean,
): Promise<{ items: number; downloaded: number; replaced: number; skipped: number; failed: number }> {
  const files = await listAll(drive, sectionId);
  const images = files.filter(isImageFile);

  if (images.length === 0) return { items: 0, downloaded: 0, replaced: 0, skipped: 0, failed: 0 };

  console.log(`  Favicon: ${images.length} file(s)`);

  if (dryRun) {
    for (const img of images) {
      console.log(`    → public/${img.name}`);
    }
    return { items: images.length, downloaded: 0, replaced: 0, skipped: 0, failed: 0 };
  }

  const publicDir = join(process.cwd(), 'public');

  let downloaded = 0;
  let replaced = 0;
  let skipped = 0;
  let failed = 0;

  for (const img of images) {
    const targetFile = join(publicDir, img.name);
    const result = await downloadWithCheck(drive, img, targetFile);
    switch (result) {
      case 'downloaded': downloaded += 1; break;
      case 'replaced': replaced += 1; break;
      case 'skipped': skipped += 1; break;
      case 'failed': failed += 1; break;
    }
  }

  return { items: images.length, downloaded, replaced, skipped, failed };
}

async function run(): Promise<void> {
  const dryRun = isDryRun();
  const debugTree = isDebugTree();

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

  console.log('Locating Assets...');

  let assetsId: string;
  try {
    assetsId = await resolveAssetsRoot(drive, folderId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to locate assets: ${message}`);
    process.exit(1);
  }

  if (debugTree) {
    for (const section of SECTIONS) {
      const sectionId = await findChildFolder(drive, assetsId, section.label);
      if (!sectionId) {
        console.log(`\n${section.label}: (not found)`);
        continue;
      }
      console.log(`\n${section.label}`);
      await printTree(drive, sectionId, '');
    }
    process.exit(0);
  }

  console.log('');
  console.log('Scanning asset sections...');
  console.log('');

  let totalItems = 0;
  let totalDownloaded = 0;
  let totalReplaced = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const section of SECTIONS) {
    const sectionId = await findChildFolder(drive, assetsId, section.label);
    if (!sectionId) {
      console.log(`  ${section.label}: (not found, skipping)`);
      continue;
    }

    let result: { items: number; downloaded: number; replaced: number; skipped: number; failed: number };

    switch (section.type) {
      case 'product-images':
        result = await importProductImages(drive, sectionId, dryRun);
        break;
      case 'homepage-images':
        result = await importHomepageImages(drive, sectionId, dryRun);
        break;
      case 'collection-images':
        result = await importCollectionImages(drive, sectionId, dryRun);
        break;
      case 'business-area-images':
        result = await importBusinessAreaImages(drive, sectionId, dryRun);
        break;
      case 'flat-files':
        result = await importFlatSection(drive, sectionId, FLAT_TARGET[section.label], section.label, dryRun);
        break;
      case 'favicon':
        result = await importFavicon(drive, sectionId, dryRun);
        break;
    }

    totalItems += result.items;
    totalDownloaded += result.downloaded;
    totalReplaced += result.replaced;
    totalSkipped += result.skipped;
    totalFailed += result.failed;
  }

  console.log('');
  console.log('Summary:');
  console.log(`  Asset files:      ${totalItems}`);
  console.log(`  Downloaded:       ${totalDownloaded}`);
  console.log(`  Replaced:         ${totalReplaced}`);
  console.log(`  Skipped (unchanged): ${totalSkipped}`);

  if (totalFailed > 0) {
    console.log(`  Failed:           ${totalFailed}`);
  }

  if (dryRun) {
    console.log('');
    console.log('No files changed (dry run).');
  }

  console.log('');
  console.log('Import completed.');
}

await run();
