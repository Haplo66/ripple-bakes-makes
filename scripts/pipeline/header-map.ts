/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import type { DatasetName } from './types.ts';

/**
 * Maps human-friendly source headers (Google Sheets columns or CSV headers)
 * to the canonical keys consumed by the normalizers.
 *
 * Unmapped headers pass through unchanged, so adding new source columns is
 * backward-compatible: they are preserved under their original name.
 */
export const HEADER_MAP: Record<DatasetName, Record<string, string>> = {
  collections: {
    'Business Area': 'businessArea',
    'Collection ID': 'id',
    'Collection Name': 'name',
    'Subtitle': 'subtitle',
    'Slug': 'slug',
    'Short Description': 'shortDescription',
    'Description': 'description',
    'Image Folder': 'imageFolder',
    'Hero Image': 'heroImage',
    'Images': 'images',
    'Featured': 'featured',
    'Status': 'status',
    'Display Order': 'displayOrder',
    'Image Tone': 'imageTone',
    'Gallery Captions': 'galleryCaptions',
    'Popular Ideas': 'popularIdeas',
    'Customization Note': 'customizationNote',
  },
  products: {
    'Product ID': 'id',
    'Business Area': 'businessArea',
    'Product Name': 'name',
    'Subtitle': 'subtitle',
    'Slug': 'slug',
    'Short Description': 'shortDescription',
    'Description': 'description',
    'Collection': 'collection',
    'Category': 'category',
    'Form ID': 'formId',
    'Image Folder': 'imageFolder',
    'Image': 'image',
    'Images': 'images',
    'Image Tone': 'imageTone',
    'Price': 'price',
    'Price Label': 'priceLabel',
    'Featured': 'featured',
    'Homepage Featured': 'homepageFeatured',
    'Gallery Featured': 'galleryFeatured',
    'Status': 'status',
    'Active': 'active',
    'Display Order': 'displayOrder',
  },
  forms: {
    'Form ID': 'formId',
    'Form Name': 'formName',
    'Field Name': 'fieldName',
    'Field Type': 'fieldType',
    'Values': 'values',
    'Required': 'required',
    'ID': 'id',
    'Name': 'name',
    'Fields': 'fields',
  },
};

export const normalizeHeader = (
  header: string,
  dataset: DatasetName,
): string => HEADER_MAP[dataset]?.[header] ?? header;
