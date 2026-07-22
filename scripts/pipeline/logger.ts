import type { DatasetName, PipelineWarning } from './types.ts';

const labels: Record<DatasetName, string> = {
  collections: 'collections',
  products: 'products',
  forms: 'forms',
};

export const logHeader = (name: string, version: number): void => {
  console.log(`${name} v${version}`);
  console.log('');
};

export const logReadStart = (file: string): void => {
  console.log(`Reading ${file}...`);
};

export const logDatasetResult = (
  dataset: DatasetName,
  count: number,
): void => {
  console.log(`✓ ${count} ${labels[dataset]}`);
  console.log('');
};

export const logGenerated = (files: string[]): void => {
  console.log('Generated:');
  console.log('');
  files.forEach((file) => console.log(`✓ ${file}`));
  console.log('');
};

export const logWarnings = (warnings: readonly PipelineWarning[]): void => {
  console.log(`Warnings: ${warnings.length}`);

  if (warnings.length === 0) {
    console.log('');
    return;
  }

  warnings.forEach((warning) => {
    const location = [
      warning.file,
      warning.rowNumber ? `row ${warning.rowNumber}` : undefined,
      warning.column ? `column "${warning.column}"` : undefined,
    ]
      .filter(Boolean)
      .join(', ');

    console.warn(`! ${location}: ${warning.reason}`);
  });

  console.log('');
};

export const logSuccess = (): void => {
  console.log('Pipeline completed successfully.');
};
