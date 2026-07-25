import { authenticateDriveWithWrite } from './drive-write-auth.ts';
import type { drive_v3 } from 'googleapis';

const PRODUCT_ID_PATTERN = /^[A-Z]{2}-[A-Z]{2}-\d{3}$/;
const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';

const IMAGE_MIME_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
}

interface AssetSection {
  label: string;
  type: 'product-images' | 'homepage-images' | 'business-area-images' | 'flat-files' | 'collection-images';
}

const SECTIONS: AssetSection[] = [
  { label: 'Product Images', type: 'product-images' },
  { label: 'Collection Images', type: 'collection-images' },
  { label: 'Homepage Images', type: 'homepage-images' },
  { label: 'Business Area Images', type: 'business-area-images' },
  { label: 'Logo and Symbol', type: 'flat-files' },
  { label: 'Favicon', type: 'flat-files' },
];

const BUSINESS_AREA_CODE: Record<string, string> = {
  Bakery: 'BK',
  Sewing: 'SW',
};

function isDryRun(): boolean {
  return process.argv.includes('--dry-run');
}

function getTargetProduct(): string | null {
  const idx = process.argv.indexOf('--product');
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return null;
}

function hasExtension(name: string): boolean {
  return /\.\w+$/.test(name);
}

function getExtension(mimeType: string): string | null {
  return IMAGE_MIME_MAP[mimeType] || null;
}

function isProductId(name: string): boolean {
  return PRODUCT_ID_PATTERN.test(name);
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
  const assetsId = await findChildFolder(drive, rootId, 'Assets');
  if (!assetsId) {
    throw new Error('Could not find "Assets" folder under the root.');
  }
  return assetsId;
}

async function renameFile(
  drive: drive_v3.Drive,
  fileId: string,
  newName: string,
): Promise<void> {
  await drive.files.update({
    fileId,
    requestBody: { name: newName },
  });
}

function fixFiles(
  files: DriveItem[],
): { alreadyCorrect: string[]; skipped: string[]; toFix: { file: DriveItem; newName: string }[] } {
  const existingNames = new Set(files.map((f) => f.name));
  const alreadyCorrect: string[] = [];
  const skipped: string[] = [];
  const toFix: { file: DriveItem; newName: string }[] = [];

  for (const file of files) {
    if (file.mimeType === DRIVE_FOLDER_MIME) {
      continue;
    }

    if (hasExtension(file.name)) {
      alreadyCorrect.push(file.name);
      continue;
    }

    const ext = getExtension(file.mimeType);
    if (!ext) {
      skipped.push(`${file.name} (${file.mimeType})`);
      continue;
    }

    const newName = `${file.name}${ext}`;

    if (existingNames.has(newName)) {
      skipped.push(`${file.name} → ${newName} (target already exists)`);
      continue;
    }

    toFix.push({ file, newName });
  }

  return { alreadyCorrect, skipped, toFix };
}

async function processProductImages(
  drive: drive_v3.Drive,
  sectionId: string,
  targetProduct: string | null,
  dryRun: boolean,
): Promise<{ checked: number; renamed: number; skipped: number; errors: number }> {
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

  let targets: DriveItem[];
  if (targetProduct) {
    const match = productFolders.find((f) => f.name === targetProduct);
    if (!match) {
      console.error(`  Product folder "${targetProduct}" not found.`);
      return { checked: 0, renamed: 0, skipped: 0, errors: 0 };
    }
    targets = [match];
  } else {
    targets = productFolders.sort((a, b) => a.name.localeCompare(b.name));
  }

  console.log(`  Found ${targets.length} product folder(s)`);

  let checked = 0;
  let renamed = 0;
  let skipped = 0;
  let errors = 0;

  for (const pf of targets) {
    const files = await listAll(drive, pf.id);
    const { alreadyCorrect, skipped: sk, toFix } = fixFiles(files);

    checked += files.length;
    skipped += alreadyCorrect.length + sk.length;

    console.log(`  ${pf.name}`);
    for (const name of alreadyCorrect) {
      console.log(`    ✓ ${name}`);
    }
    for (const s of sk) {
      console.log(`    - ${s}`);
    }
    for (const fix of toFix) {
      console.log(`    🔧 ${fix.file.name} → ${fix.newName}`);
    }

    if (!dryRun) {
      for (const fix of toFix) {
        try {
          await renameFile(drive, fix.file.id, fix.newName);
          renamed += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`    ✗ ${fix.file.name}: ${message}`);
          errors += 1;
        }
      }
    } else {
      renamed += toFix.length;
    }
  }

  return { checked, renamed, skipped, errors };
}

async function processFlatSection(
  drive: drive_v3.Drive,
  sectionId: string,
  label: string,
  dryRun: boolean,
): Promise<{ checked: number; renamed: number; skipped: number; errors: number }> {
  const files = await listAll(drive, sectionId);
  const { alreadyCorrect, skipped: sk, toFix } = fixFiles(files);

  const checked = files.length;
  const skipped = alreadyCorrect.length + sk.length;
  let renamed = 0;
  let errors = 0;

  if (toFix.length > 0 || alreadyCorrect.length > 0 || sk.length > 0) {
    console.log(`  ${label}`);
    for (const name of alreadyCorrect) {
      console.log(`    ✓ ${name}`);
    }
    for (const s of sk) {
      console.log(`    - ${s}`);
    }
    for (const fix of toFix) {
      console.log(`    🔧 ${fix.file.name} → ${fix.newName}`);
    }
  }

  if (!dryRun) {
    for (const fix of toFix) {
      try {
        await renameFile(drive, fix.file.id, fix.newName);
        renamed += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`    ✗ ${fix.file.name}: ${message}`);
        errors += 1;
      }
    }
  } else {
    renamed += toFix.length;
  }

  return { checked, renamed, skipped, errors };
}

async function processHomepageImages(
  drive: drive_v3.Drive,
  sectionId: string,
  dryRun: boolean,
): Promise<{ checked: number; renamed: number; skipped: number; errors: number }> {
  const subfolders = await listAll(drive, sectionId);
  const folders = subfolders.filter((s) => s.mimeType === DRIVE_FOLDER_MIME);
  console.log(`  Homepage Images: ${folders.length} subfolder(s)`);
  let total = { checked: 0, renamed: 0, skipped: 0, errors: 0 };

  for (const sub of folders) {
    const result = await processFlatSection(drive, sub.id, `${sub.name}/`, dryRun);
    total.checked += result.checked;
    total.renamed += result.renamed;
    total.skipped += result.skipped;
    total.errors += result.errors;
  }

  return total;
}

async function processCollectionImages(
  drive: drive_v3.Drive,
  sectionId: string,
  dryRun: boolean,
): Promise<{ checked: number; renamed: number; skipped: number; errors: number }> {
  const subfolders = await listAll(drive, sectionId);
  const folders = subfolders.filter((s) => s.mimeType === DRIVE_FOLDER_MIME);
  console.log(`  Collection Images: ${folders.length} subfolder(s)`);
  let total = { checked: 0, renamed: 0, skipped: 0, errors: 0 };

  for (const sub of folders) {
    const result = await processFlatSection(drive, sub.id, `${sub.name}/`, dryRun);
    total.checked += result.checked;
    total.renamed += result.renamed;
    total.skipped += result.skipped;
    total.errors += result.errors;
  }

  return total;
}

async function processBusinessAreaImages(
  drive: drive_v3.Drive,
  sectionId: string,
  dryRun: boolean,
): Promise<{ checked: number; renamed: number; skipped: number; errors: number }> {
  const areas = await listAll(drive, sectionId);
  let total = { checked: 0, renamed: 0, skipped: 0, errors: 0 };

  for (const area of areas) {
    if (area.mimeType !== DRIVE_FOLDER_MIME) continue;
    const code = BUSINESS_AREA_CODE[area.name];
    const label = code ? `${area.name} → ${code}` : area.name;

    const innerFolderId = await findChildFolder(drive, area.id, code);
    const scanFolderId = innerFolderId || area.id;
    const scanLabel = innerFolderId ? `${label}/${code}` : label;

    const result = await processFlatSection(drive, scanFolderId, scanLabel, dryRun);
    total.checked += result.checked;
    total.renamed += result.renamed;
    total.skipped += result.skipped;
    total.errors += result.errors;
  }

  return total;
}

async function run(): Promise<void> {
  const dryRun = isDryRun();
  const targetProduct = getTargetProduct();

  console.log('RIPPLE Drive Image Extension Repair');
  console.log('');

  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) {
    console.error(
      'Missing GOOGLE_DRIVE_ROOT_FOLDER_ID environment variable.\n' +
      'Set it to the ID of the RIPPLE Business Data folder in Google Drive.',
    );
    process.exit(1);
  }

  console.log('Connecting to Google Drive...');

  let drive: drive_v3.Drive;
  try {
    drive = await authenticateDriveWithWrite();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Authentication failed: ${message}`);
    process.exit(1);
  }

  let assetsId: string;
  try {
    assetsId = await resolveAssetsRoot(drive, rootId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to locate assets: ${message}`);
    process.exit(1);
  }

  console.log('Scanning:');
  console.log('  Assets/');
  console.log('');

  let totalChecked = 0;
  let totalRenamed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const section of SECTIONS) {
    const sectionId = await findChildFolder(drive, assetsId, section.label);
    if (!sectionId) {
      console.log(`  ${section.label}: (not found, skipping)`);
      continue;
    }

    let result: { checked: number; renamed: number; skipped: number; errors: number };

    switch (section.type) {
      case 'product-images':
        result = await processProductImages(drive, sectionId, targetProduct, dryRun);
        break;
      case 'homepage-images':
        result = await processHomepageImages(drive, sectionId, dryRun);
        break;
      case 'collection-images':
        result = await processCollectionImages(drive, sectionId, dryRun);
        break;
      case 'business-area-images':
        result = await processBusinessAreaImages(drive, sectionId, dryRun);
        break;
      case 'flat-files':
        result = await processFlatSection(drive, sectionId, section.label, dryRun);
        break;
    }

    totalChecked += result.checked;
    totalRenamed += result.renamed;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
  }

  console.log('');
  console.log('Summary:');
  console.log(`  Files checked:    ${totalChecked}`);
  console.log(`  Files renamed:    ${dryRun ? totalRenamed + ' (dry run)' : totalRenamed}`);
  console.log(`  Files skipped:    ${totalSkipped}`);
  console.log(`  Errors:           ${totalErrors}`);

  if (dryRun && totalRenamed === 0) {
    console.log('');
    console.log('No files need extension fixes.');
  }

  console.log('');
  console.log('Done.');
}

await run();
