import { join } from 'node:path';
import { IMAGE_DIR } from './constants.ts';
import { scanImageFolder } from './image-scanner.ts';
import type { PipelineWarning } from './types.ts';

export interface ResolvedImages {
  images: string[];
  primaryImage: string;
  imageFolder: string;
}

const BUSINESS_AREA_CODES: Record<string, string> = {
  bakery: 'BK',
  sewing: 'SW',
  BK: 'BK',
  SW: 'SW',
};

const toBusinessAreaCode = (area: string): string =>
  BUSINESS_AREA_CODES[area] ?? area;

export function resolveProductImages(
  productId: string,
  collectionId: string,
  businessAreaId: string,
  warnings: PipelineWarning[],
  context: { file: string },
): ResolvedImages {
  const productFolder = join(IMAGE_DIR, 'products', productId);
  const productResult = scanImageFolder(productFolder);

  if (productResult.found) {
    return {
      images: productResult.files,
      primaryImage: productResult.files[0],
      imageFolder: `products/${productId}`,
    };
  }

  const collectionFolder = join(IMAGE_DIR, 'collections', collectionId);
  const collectionResult = scanImageFolder(collectionFolder);

  if (collectionResult.found) {
    return {
      images: collectionResult.files,
      primaryImage: collectionResult.files[0],
      imageFolder: `collections/${collectionId}`,
    };
  }

  const code = toBusinessAreaCode(businessAreaId);
  const businessAreaFolder = join(IMAGE_DIR, 'business-areas', code);
  const businessResult = scanImageFolder(businessAreaFolder);

  if (businessResult.found) {
    return {
      images: businessResult.files,
      primaryImage: businessResult.files[0],
      imageFolder: `business-areas/${code}`,
    };
  }

  warnings.push({
    file: context.file,
    reason: `Product ${productId} is using default image.`,
  });

  return {
    images: [],
    primaryImage: '',
    imageFolder: '',
  };
}

export function resolveCollectionImages(
  collectionCode: string,
): { images: string[]; primaryImage: string; imageFolder: string } {
  const collectionFolder = join(IMAGE_DIR, 'collections', collectionCode);
  const result = scanImageFolder(collectionFolder);

  if (result.found) {
    return {
      images: result.files,
      primaryImage: result.files[0],
      imageFolder: `collections/${collectionCode}`,
    };
  }

  return {
    images: [],
    primaryImage: '',
    imageFolder: '',
  };
}
