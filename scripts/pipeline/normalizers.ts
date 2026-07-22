import type { CsvRecord, PipelineWarning } from './types.ts';

const parseBoolean = (value: string, fallback = false): boolean => {
  if (!value) return fallback;
  return ['true', 'yes', '1', 'active'].includes(value.toLowerCase());
};

const parseNumber = (value: string, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseNullableString = (value: string): string | null =>
  value.trim() ? value.trim() : null;

const parseJsonField = <T>(
  value: string,
  fallback: T,
  context: {
    file: string;
    rowNumber: number;
    column: string;
    warnings: PipelineWarning[];
  },
): T => {
  if (!value.trim()) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    context.warnings.push({
      file: context.file,
      rowNumber: context.rowNumber,
      column: context.column,
      reason: 'Value must be valid JSON.',
    });
    return fallback;
  }
};

export const normalizeCollections = (
  records: CsvRecord[],
  file: string,
  warnings: PipelineWarning[],
) =>
  records.map(({ rowNumber, values }) => ({
    id: values.id,
    businessArea: values.businessArea.toLowerCase(),
    slug: values.slug,
    name: values.name,
    subtitle: values.subtitle,
    shortDescription: values.shortDescription,
    description: values.description,
    imageFolder: values.imageFolder,
    heroImage: parseNullableString(values.heroImage ?? ''),
    featured: parseBoolean(values.featured),
    status: values.status || 'Active',
    displayOrder: parseNumber(values.displayOrder),
    imageTone: values.imageTone || 'cream',
    galleryCaptions: parseJsonField<string[]>(values.galleryCaptions ?? '', [], {
      file,
      rowNumber,
      column: 'galleryCaptions',
      warnings,
    }),
    popularIdeas: parseJsonField<string[]>(values.popularIdeas ?? '', [], {
      file,
      rowNumber,
      column: 'popularIdeas',
      warnings,
    }),
    customizationNote: values.customizationNote ?? '',
  }));

export const normalizeProducts = (records: CsvRecord[]) =>
  records.map(({ values }) => ({
    id: values.id,
    businessArea: values.businessArea.toLowerCase(),
    collection: values.collection,
    category: values.category,
    slug: values.slug,
    name: values.name,
    subtitle: values.subtitle,
    shortDescription: values.shortDescription,
    description: values.description,
    status: values.status || 'Active',
    featured: parseBoolean(values.featured),
    imageFolder: values.imageFolder,
    formId: values.formId,
    image: parseNullableString(values.image ?? ''),
    imageTone: values.imageTone || 'cream',
    active: parseBoolean(values.active, true),
    displayOrder: parseNumber(values.displayOrder),
    priceLabel: values.priceLabel,
  }));

export const normalizeForms = (
  records: CsvRecord[],
  file: string,
  warnings: PipelineWarning[],
) =>
  records.map(({ rowNumber, values }) => ({
    id: values.id,
    name: values.name,
    description: values.description,
    fields: parseJsonField(values.fields ?? '', [], {
      file,
      rowNumber,
      column: 'fields',
      warnings,
    }),
  }));
