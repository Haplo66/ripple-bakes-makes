export type DatasetName = 'collections' | 'products' | 'forms';

export type CsvRow = Record<string, string>;

export interface CsvRecord {
  rowNumber: number;
  values: CsvRow;
}

export interface PipelineWarning {
  file: string;
  rowNumber?: number;
  column?: string;
  reason: string;
}

export interface PipelineMetadata {
  generated: true;
  generatedAt: string;
  source: 'Honeycomb Data Pipeline';
  version: 1;
}

export interface GeneratedJson<T> {
  _metadata: PipelineMetadata;
  data: T[];
}
