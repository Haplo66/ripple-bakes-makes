import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { OUTPUT_DIR, PIPELINE_NAME, PIPELINE_VERSION } from './constants.ts';
import type { GeneratedJson } from './types.ts';

export const sortById = <T extends { id: string }>(records: T[]): T[] =>
  records.slice().sort((a, b) => a.id.localeCompare(b.id));

export const createGeneratedJson = <T>(data: T[]): GeneratedJson<T> => ({
  _metadata: {
    generated: true,
    generatedAt: new Date().toISOString(),
    source: PIPELINE_NAME,
    version: PIPELINE_VERSION,
  },
  data,
});

export const writeGeneratedJson = <T>(
  fileName: string,
  data: T[],
): void => {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(OUTPUT_DIR, fileName);
  writeFileSync(
    outputPath,
    `${JSON.stringify(createGeneratedJson(data), null, 2)}\n`,
  );
};
