export interface NameMapping {
  name: string;
  slug: string;
}

export interface MappedData {
  products: Map<string, NameMapping>;
  collections: Map<string, NameMapping>;
  businessAreas: Map<string, NameMapping>;
  /**
   * Reverse lookups: collectionSlug → collectionCode, areaSlug → areaCode
   */
  collectionSlugToCode: Map<string, string>;
  areaSlugToCode: Map<string, string>;
}

export interface RenameOp {
  type: 'folder' | 'file';
  section: string;
  oldName: string;
  newName: string;
  driveId: string;
  status: 'ready' | 'renamed' | 'skipped' | 'conflict' | 'error';
  error?: string;
}

export interface SectionReport {
  section: string;
  foldersRenamed: number;
  filesRenamed: number;
  conflicts: number;
  errors: number;
  skipped: number;
  ops: RenameOp[];
}

export interface MigrationReport {
  generatedAt: string;
  dryRun: boolean;
  sections: SectionReport[];
  summary: {
    totalFolders: number;
    totalFiles: number;
    renamed: number;
    conflicts: number;
    errors: number;
    skipped: number;
  };
}

export interface ManifestFile {
  name: string;
  md5: string;
  primary: boolean;
}

export interface ManifestEntry {
  code: string;
  folder: string;
  files: ManifestFile[];
}

export interface AssetManifest {
  _metadata: {
    version: number;
    generatedAt: string;
    tool: string;
  };
  products: ManifestEntry[];
  collections: ManifestEntry[];
  businessAreas: ManifestEntry[];
}

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  md5Checksum?: string | null;
}
