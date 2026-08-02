/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { DoctorResult } from "./types.ts";

const IMAGE_DIR = path.resolve("public/images");
const SUPPORTED_FORMATS = /\.(jpg|jpeg|png|webp)$/i;

type ProductRecord = {
  id: string;
  name?: string;
  price?: number;
  shortDescription?: string;
  description?: string;
  businessArea?: string;
  collection?: string;
  formId?: string;
  images?: string[];
  imageFolder?: string;
  featured?: boolean;
  homepageFeatured?: boolean;
  galleryFeatured?: boolean;
  active?: boolean;
};

type CollectionRecord = {
  id: string;
};

type FormRecord = {
  id: string;
};

type ProductAnalysis = {
  id: string;
  name: string;
  hasPrice: boolean;
  hasShortDescription: boolean;
  hasDescription: boolean;
  hasBusinessArea: boolean;
  hasValidCollection: boolean;
  hasValidFormId: boolean | null;
  imageCount: number;
  imageScore: string;
  isFeatured: boolean;
  isHomepageFeatured: boolean;
  isGalleryFeatured: boolean;
};

type BusinessMetrics = {
  totalProducts: number;
  activeProducts: number;
  featuredProducts: number;
  homepageFeatured: number;
  galleryFeatured: number;
  totalImages: number;
  averageImagesPerProduct: number;
  missingShortDescriptions: number;
  missingDescriptions: number;
  missingPrices: number;
  missingFormRefs: number;
  productsWithNoImages: number;
  productsWithOneImage: number;
};

type FormCoverage = {
  productsWithForms: number;
  uniqueFormIds: number;
  valid: number;
  missing: number;
  missingIds: string[];
};

type RecommendEntry = {
  priority: "HIGH" | "MEDIUM";
  text: string;
};

export type BusinessHealthResult = {
  score: number;
  maxScore: number;
  status: "GOOD" | "ATTENTION" | "CRITICAL";
  metrics: BusinessMetrics;
  productAnalysis: ProductAnalysis[];
  formCoverage: FormCoverage;
  recommendations: RecommendEntry[];
};

function readJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

function scanFolder(folderPath: string): string[] {
  try {
    if (!fs.existsSync(folderPath)) return [];
    return fs.readdirSync(folderPath).filter((f) => SUPPORTED_FORMATS.test(f));
  } catch {
    return [];
  }
}

export function imageScore(count: number): string {
  if (count === 0) return "FAIL";
  if (count === 1) return "WARN";
  return "PASS";
}

export function analyzeProducts(
  products: ProductRecord[],
  validCollectionIds: Set<string>,
  validFormIds: Set<string>,
): ProductAnalysis[] {
  return products
    .filter((p) => p.active !== false)
    .map((p) => {
      let actualImageCount = 0;
      if (p.imageFolder) {
        actualImageCount = scanFolder(path.join(IMAGE_DIR, p.imageFolder)).length;
      }
      if (actualImageCount === 0 && p.images) {
        actualImageCount = p.images.length;
      }
      const hasFormId = !!p.formId;
      const formValid = hasFormId ? validFormIds.has(p.formId!) : null;
      return {
        id: p.id,
        name: p.name || p.id,
        hasPrice: p.price !== undefined && p.price !== null && p.price !== 0,
        hasShortDescription: !!(p.shortDescription && p.shortDescription.trim().length > 0),
        hasDescription: !!(p.description && p.description.trim().length > 0),
        hasBusinessArea: !!p.businessArea,
        hasValidCollection: validCollectionIds.has(p.collection || ""),
        hasValidFormId: formValid,
        imageCount: actualImageCount,
        imageScore: imageScore(actualImageCount),
        isFeatured: !!p.featured,
        isHomepageFeatured: !!p.homepageFeatured,
        isGalleryFeatured: !!p.galleryFeatured,
      };
    });
}

export function computeMetrics(analysis: ProductAnalysis[]): BusinessMetrics {
  const metrics: BusinessMetrics = {
    totalProducts: analysis.length,
    activeProducts: analysis.length,
    featuredProducts: analysis.filter((p) => p.isFeatured).length,
    homepageFeatured: analysis.filter((p) => p.isHomepageFeatured).length,
    galleryFeatured: analysis.filter((p) => p.isGalleryFeatured).length,
    totalImages: analysis.reduce((s, p) => s + p.imageCount, 0),
    averageImagesPerProduct: 0,
    missingShortDescriptions: analysis.filter((p) => !p.hasShortDescription).length,
    missingDescriptions: analysis.filter((p) => !p.hasDescription).length,
    missingPrices: analysis.filter((p) => !p.hasPrice).length,
    missingFormRefs: analysis.filter((p) => p.hasValidFormId === false).length,
    productsWithNoImages: analysis.filter((p) => p.imageCount === 0).length,
    productsWithOneImage: analysis.filter((p) => p.imageCount === 1).length,
  };
  metrics.averageImagesPerProduct = analysis.length > 0
    ? Math.round((metrics.totalImages / analysis.length) * 10) / 10
    : 0;
  return metrics;
}

export function computeFormCoverage(
  products: ProductRecord[],
  validFormIds: Set<string>,
): FormCoverage {
  const referencedIds = new Set<string>();
  let productsWithForms = 0;
  for (const p of products) {
    if (p.formId) {
      referencedIds.add(p.formId);
      productsWithForms++;
    }
  }
  const missing: string[] = [];
  for (const id of referencedIds) {
    if (!validFormIds.has(id)) missing.push(id);
  }
  return {
    productsWithForms,
    uniqueFormIds: referencedIds.size,
    valid: referencedIds.size - missing.length,
    missing: missing.length,
    missingIds: missing,
  };
}

export function calculateBusinessScore(
  analysis: ProductAnalysis[],
  metrics: BusinessMetrics,
  formCoverage: FormCoverage,
): number {
  let score = 100;
  score -= metrics.missingPrices * 5;
  score -= metrics.missingShortDescriptions * 2;
  score -= metrics.missingDescriptions * 2;
  score -= metrics.productsWithNoImages * 5;
  score -= metrics.productsWithOneImage * 2;
  score -= formCoverage.missing * 3;
  return Math.max(0, score);
}

function getStatus(score: number): "GOOD" | "ATTENTION" | "CRITICAL" {
  if (score >= 90) return "GOOD";
  if (score >= 70) return "ATTENTION";
  return "CRITICAL";
}

export function generateRecommendations(
  analysis: ProductAnalysis[],
  metrics: BusinessMetrics,
  formCoverage: FormCoverage,
): RecommendEntry[] {
  const recs: RecommendEntry[] = [];

  for (const p of analysis) {
    if (p.imageCount === 0) {
      recs.push({ priority: "HIGH", text: p.name + " (" + p.id + ") has no images." });
    } else if (p.imageCount === 1) {
      recs.push({ priority: "HIGH", text: p.name + " (" + p.id + ") has only 1 image." });
    }
    if (!p.hasDescription) {
      recs.push({ priority: "HIGH", text: p.name + " (" + p.id + ") is missing description." });
    }
  }

  if (metrics.missingShortDescriptions > 0) {
    recs.push({ priority: "MEDIUM", text: metrics.missingShortDescriptions + " products are missing short descriptions." });
  }

  if (formCoverage.missing > 0) {
    recs.push({ priority: "HIGH", text: formCoverage.missing + " form(s) are missing: " + formCoverage.missingIds.join(", ") });
  }

  if (metrics.homepageFeatured < 3) {
    recs.push({ priority: "MEDIUM", text: "Consider adding more homepage featured products (currently " + metrics.homepageFeatured + ")." });
  }

  return recs;
}

function buildBusinessHealth(): BusinessHealthResult {
  const products = readJson<{ data: ProductRecord[] }>(path.resolve("src/content/products.json"));
  const collections = readJson<{ data: CollectionRecord[] }>(path.resolve("src/content/collections.json"));
  const forms = readJson<{ data: FormRecord[] }>(path.resolve("src/content/forms.json"));

  const validCollectionIds = new Set((collections?.data || []).map((c) => c.id));
  const validFormIds = new Set((forms?.data || []).map((f) => f.id));
  const allProducts = products?.data || [];

  const analysis = analyzeProducts(allProducts, validCollectionIds, validFormIds);
  const metrics = computeMetrics(analysis);
  const formCoverage = computeFormCoverage(allProducts, validFormIds);
  const score = calculateBusinessScore(analysis, metrics, formCoverage);
  const status = getStatus(score);
  const recommendations = generateRecommendations(analysis, metrics, formCoverage);

  return {
    score,
    maxScore: 100,
    status,
    metrics,
    productAnalysis: analysis,
    formCoverage,
    recommendations,
  };
}

type BusinessHealthByArea = Record<string, BusinessHealthResult>;

export function buildBusinessHealthByArea(): BusinessHealthByArea {
  const products = readJson<{ data: ProductRecord[] }>(path.resolve("src/content/products.json"));
  const collections = readJson<{ data: CollectionRecord[] }>(path.resolve("src/content/collections.json"));
  const forms = readJson<{ data: FormRecord[] }>(path.resolve("src/content/forms.json"));

  const validCollectionIds = new Set((collections?.data || []).map((c) => c.id));
  const validFormIds = new Set((forms?.data || []).map((f) => f.id));
  const allProducts = products?.data || [];

  const byArea = new Map<string, ProductRecord[]>();
  for (const p of allProducts) {
    const area = p.businessArea || "unknown";
    if (!byArea.has(area)) {
      byArea.set(area, []);
    }
    byArea.get(area)!.push(p);
  }

  const result: BusinessHealthByArea = {};
  for (const [area, areaProducts] of byArea) {
    const analysis = analyzeProducts(areaProducts, validCollectionIds, validFormIds);
    const metrics = computeMetrics(analysis);
    const formCoverage = computeFormCoverage(areaProducts, validFormIds);
    const score = calculateBusinessScore(analysis, metrics, formCoverage);
    const status = getStatus(score);
    const recommendations = generateRecommendations(analysis, metrics, formCoverage);

    result[area] = {
      score,
      maxScore: 100,
      status,
      metrics,
      productAnalysis: analysis,
      formCoverage,
      recommendations,
    };
  }

  return result;
}

export type { BusinessHealthByArea };