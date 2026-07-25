import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECT_ROOT, OUTPUT_DIR, OUTPUT_FILES } from './constants.ts';

const NODE = process.execPath;
const ENV_FILE = join(PROJECT_ROOT, '.env');
const SCRIPTS = join(PROJECT_ROOT, 'scripts', 'pipeline');

function runScript(name: string, args: string[] = []): void {
  const script = join(SCRIPTS, name);
  const quotedNode = NODE.includes(' ') ? `"${NODE}"` : NODE;
  const cmd = [quotedNode, `--env-file="${ENV_FILE}"`, '--experimental-strip-types', `"${script}"`, ...args].join(' ');
  execSync(cmd, { stdio: 'inherit', cwd: PROJECT_ROOT, shell: true });
}

function validateEnv(): void {
  const required = [
    'GOOGLE_SHEETS_CLIENT_EMAIL',
    'GOOGLE_SHEETS_PRIVATE_KEY',
    'GOOGLE_DRIVE_ROOT_FOLDER_ID',
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables:\n  ${missing.join('\n  ')}`);
    console.error(`Ensure they are set in .env`);
    process.exit(1);
  }
}

function validateGeneratedContent(): { warnings: number } {
  let warnings = 0;

  for (const [key, filename] of Object.entries(OUTPUT_FILES)) {
    const filePath = join(OUTPUT_DIR, filename);
    if (!existsSync(filePath)) {
      console.warn(`  ⚠ ${filename}: not found`);
      warnings += 1;
      continue;
    }

    try {
      const content = JSON.parse(readFileSync(filePath, 'utf-8'));
      if (!content.data || !Array.isArray(content.data)) {
        console.warn(`  ⚠ ${filename}: missing "data" array`);
        warnings += 1;
        continue;
      }
      if (content.data.length === 0) {
        console.warn(`  ⚠ ${filename}: empty dataset`);
        warnings += 1;
      }

      if (key === 'products') {
        for (const product of content.data) {
          if (!product.image && (!product.images || product.images.length === 0)) {
            console.warn(`  ⚠ Product ${product.id} "${product.name}": no product image`);
            warnings += 1;
          }
          if (!product.shortDescription) {
            console.warn(`  ⚠ Product ${product.id} "${product.name}": missing description`);
            warnings += 1;
          }
        }
      }
    } catch {
      console.warn(`  ⚠ ${filename}: invalid JSON`);
      warnings += 1;
    }
  }

  return { warnings };
}

async function run(): Promise<void> {
  console.log('═══════════════════════════════════════');
  console.log('  RIPPLE Site Update');
  console.log('═══════════════════════════════════════');
  console.log('');

  console.log('── Step 1: Validate Environment ──');
  console.log('');
  validateEnv();
  console.log('  Environment OK');
  console.log('');

  console.log('── Step 2: Repair Drive Image Extensions ──');
  console.log('');
  runScript('drive-fix-image-extensions.ts');
  console.log('');

  console.log('── Step 3: Import Drive Assets ──');
  console.log('');
  runScript('drive-product-image-importer.ts');
  console.log('');

  console.log('── Step 4: Import Google Sheets Data ──');
  console.log('');
  runScript('import-data.ts');
  console.log('');

  console.log('── Step 5: Validate Generated Content ──');
  console.log('');
  const { warnings } = validateGeneratedContent();
  if (warnings > 0) {
    console.log(`  ${warnings} warning(s) found — review above`);
  } else {
    console.log('  All content validated OK');
  }
  console.log('');

  console.log('── Step 6: Build Website ──');
  console.log('');
  execSync('npx astro build', { stdio: 'inherit', cwd: PROJECT_ROOT });

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('  Update complete.');
  console.log('═══════════════════════════════════════');
}

await run();
