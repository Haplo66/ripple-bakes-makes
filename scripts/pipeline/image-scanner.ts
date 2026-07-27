import { readdirSync } from 'node:fs';

export interface ScanResult {
  found: boolean;
  files: string[];
}

export const SCANNED_IMAGE_PATTERN = /\.(jpg|jpeg|png|webp)$/i;

export function scanImageFolder(folderPath: string): ScanResult {
  try {
    const files = readdirSync(folderPath)
      .filter((f) => SCANNED_IMAGE_PATTERN.test(f))
      .sort((a, b) => {
        const aIsMain = a.startsWith('main-');
        const bIsMain = b.startsWith('main-');
        if (aIsMain && !bIsMain) return -1;
        if (!aIsMain && bIsMain) return 1;
        return a.localeCompare(b);
      });

    return { found: files.length > 0, files };
  } catch {
    return { found: false, files: [] };
  }
}
