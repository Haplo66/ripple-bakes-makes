/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import type { CsvRecord, PipelineWarning } from './types.ts';

export const parseBoolean = (value: string, fallback = false): boolean => {
  if (!value) return fallback;
  return ['true', 'yes', '1', 'active'].includes(value.toLowerCase());
};

export const parseNumber = (value: string, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const parseNullableString = (value: string): string | null =>
  value.trim() ? value.trim() : null;

export const parsePipeField = (value: string): string[] =>
  value.trim() ? value.split('|').map((part) => part.trim()).filter(Boolean) : [];

/** Shared normalization: lowercase, spaces/underscores → hyphens, strip non-alphanumeric. */
export const normalizeId = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const slugify = normalizeId;

const PRICE_MARKER_RE = /\([+-]?\$(\d+)\)$/;

const encodeOptionValue = (label: string): string => {
  const marker = label.match(PRICE_MARKER_RE);

  if (marker) {
    const amount = marker[1];
    const base = label.slice(0, marker.index).trim();

    return `${slugify(base)}--${amount}`;
  }

  return slugify(label);
};

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
    id: normalizeId(values.id),
    businessArea: values.businessArea.toLowerCase(),
    code: values.code?.trim().toUpperCase() || '',
    slug: values.slug || slugify(values.name),
    name: values.name,
    subtitle: values.subtitle,
    shortDescription: values.shortDescription,
    description: values.description,
    imageFolder: values.imageFolder,
    heroImage: parseNullableString(values.heroImage ?? ''),
    images: parsePipeField(values.images ?? ''),
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
    collection: slugify(values.collection),
    category: values.category,
    slug: values.slug || slugify(values.name),
    name: values.name,
    subtitle: values.subtitle,
    shortDescription: values.shortDescription,
    description: values.description,
    status: values.status || 'Active',
    featured: parseBoolean(values.featured),
    homepageFeatured: parseBoolean(values.homepageFeatured),
    galleryFeatured: parseBoolean(values.galleryFeatured, true),
    formId: values.formId,
    image: parseNullableString(values.image ?? ''),
    images: parsePipeField(values.images ?? ''),
    imageTone: values.imageTone || 'cream',
    active: parseBoolean(values.active, true),
    displayOrder: parseNumber(values.displayOrder),
    price: values.price?.trim() ? parseNumber(values.price) : undefined,
    priceLabel: values.priceLabel,
    availability: parseNullableString(values.availability ?? '') ?? undefined,
    preparationTime: parseNullableString(values.preparationTime ?? '') ?? undefined,
    fulfillment: parseNullableString(values.fulfillment ?? '') ?? undefined,
  }));

export const normalizeProductOptions = (records: CsvRecord[]) =>
  records.map(({ values }) => ({
    id: `${values.productId}--${slugify(values.optionName)}`,
    productId: values.productId,
    optionName: values.optionName,
    optionType: values.optionType,
    values: values.values ? values.values.split('|').map((v) => v.trim()).filter(Boolean) : [],
    required: parseBoolean(values.required),
    displayOrder: parseNumber(values.displayOrder),
    placeholder: parseNullableString(values.placeholder ?? ''),
    helpText: parseNullableString(values.helpText ?? ''),
  }));

interface FormOptionRecord {
  value: string;
  label: string;
}

interface FormFieldRecord {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: FormOptionRecord[];
}

interface FormRecordOutput {
  id: string;
  name: string;
  fields: FormFieldRecord[];
}

const mapFieldType = (rawType: string): string => {
  return rawType.trim().toLowerCase();
};

const normalizeFormsNewFormat = (
  records: CsvRecord[],
): FormRecordOutput[] => {
  const groups = new Map<string, FormRecordOutput>();

  for (const { values } of records) {
    const formId = values.formId?.trim() || values['Form ID']?.trim() || '';
    const formName = values.formName?.trim() || values['Form Name']?.trim() || '';
    const fieldName = values.fieldName?.trim() || values['Field Name']?.trim() || '';
    const fieldType = values.fieldType?.trim() || values['Field Type']?.trim() || '';
    const valuesStr = values.values?.trim() || values.Values?.trim() || '';
    const required = values.required?.trim() || values.Required?.trim() || '';

    if (!formId || !fieldName) continue;

    if (!groups.has(formId)) {
      groups.set(formId, {
        id: formId,
        name: formName,
        fields: [],
      });
    }

    const group = groups.get(formId)!;

    const rawValues = valuesStr
      ? valuesStr.split(/[|,]/).map((v) => v.trim()).filter(Boolean)
      : [];

    group.fields.push({
      id: slugify(fieldName),
      label: fieldName,
      type: mapFieldType(fieldType),
      required: parseBoolean(required),
      options: rawValues.length > 0
        ? rawValues.map((v) => ({ value: encodeOptionValue(v), label: v }))
        : undefined,
    });
  }

  return Array.from(groups.values());
};

export const normalizeForms = (
  records: CsvRecord[],
  file: string,
  warnings: PipelineWarning[],
): FormRecordOutput[] => {
  if (records.length === 0) return [];

  const record = records[0];
  const hasFieldsKey = 'fields' in record.values;
  const hasFieldRowKeys =
    ('fieldName' in record.values) ||
    ('Field Name' in record.values) ||
    (('formId' in record.values || 'Form ID' in record.values) && !hasFieldsKey);

  if (hasFieldRowKeys) {
    return normalizeFormsNewFormat(records);
  }

  if (hasFieldsKey) {
    return records.map(({ rowNumber, values }) => ({
      id: values.id || values.formId || '',
      name: values.name || values.formName || '',
      fields: parseJsonField(values.fields ?? '', [], {
        file,
        rowNumber,
        column: 'fields',
        warnings,
      }),
    }));
  }

  warnings.push({
    file,
    reason: 'Forms data format not recognized. Expected row-per-field or JSON fields column.',
  });

  return [];
};
