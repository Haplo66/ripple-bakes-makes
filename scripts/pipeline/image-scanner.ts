import { readdirSync } from 'node:fs';

export interface ScanResult {
  found: boolean;
  files: string[];
}

export function scanImageFolder(folderPath: string): ScanResult {
  try {
    const files = readdirSync(folderPath)
      .filter((f) => /\.jpg$/i.test(f))
      .sort();

    return { found: files.length > 0, files };
  } catch {
    return { found: false, files: [] };
  }
}
