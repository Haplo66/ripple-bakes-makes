/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved.
 *
 */

import type { DoctorReport } from "../types.ts";
import type { BusinessHealthResult } from "../business.ts";
import * as fs from "node:fs";
import * as path from "node:path";

function jsonReport(report: DoctorReport): void {
  const bh = report.businessHealth as unknown as BusinessHealthResult;
  const reportsDir = path.resolve("scripts/doctor/reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  const filePath = path.join(reportsDir, "doctor-report.json");
  const output = {
    timestamp: report.timestamp,
    version: report.version,
    commit: report.commit,
    websiteHealth: {
      score: report.websiteHealth.score,
      maxScore: report.websiteHealth.maxScore,
      status: report.websiteHealth.status,
      summary: {
        passed: report.summary.pass,
        warnings: report.summary.warn,
        failures: report.summary.fail,
        info: report.summary.info,
      },
      recommendations: report.websiteHealth.recommendations.map((r) => ({ id: r.id, text: r.text })),
    },
    businessHealth: {
      score: bh.score,
      maxScore: bh.maxScore,
      status: bh.status,
      products: {
        total: bh.metrics.totalProducts,
        active: bh.metrics.activeProducts,
        featured: bh.metrics.featuredProducts,
        homepageFeatured: bh.metrics.homepageFeatured,
        galleryFeatured: bh.metrics.galleryFeatured,
        missingDescriptions: bh.metrics.missingDescriptions,
        missingShortDescriptions: bh.metrics.missingShortDescriptions,
        missingPrices: bh.metrics.missingPrices,
        totalImages: bh.metrics.totalImages,
        averageImagesPerProduct: bh.metrics.averageImagesPerProduct,
        productsWithNoImages: bh.metrics.productsWithNoImages,
        productsWithOneImage: bh.metrics.productsWithOneImage,
      },
      forms: {
        productsWithForms: bh.formCoverage.productsWithForms,
        uniqueFormIds: bh.formCoverage.uniqueFormIds,
        valid: bh.formCoverage.valid,
        missing: bh.formCoverage.missing,
        missingIds: bh.formCoverage.missingIds,
      },
      productAnalysis: bh.productAnalysis.map((p) => ({
        id: p.id,
        name: p.name,
        hasPrice: p.hasPrice,
        hasShortDescription: p.hasShortDescription,
        hasDescription: p.hasDescription,
        imageCount: p.imageCount,
        imageScore: p.imageScore,
        isFeatured: p.isFeatured,
        isHomepageFeatured: p.isHomepageFeatured,
        isGalleryFeatured: p.isGalleryFeatured,
        hasValidFormId: p.hasValidFormId,
      })),
      recommendations: bh.recommendations.map((r) => ({ priority: r.priority, text: r.text })),
    },
    visibility: report.visibility
      ? {
          impressions: report.visibility.impressions,
          clicks: report.visibility.clicks,
          averagePosition: report.visibility.averagePosition,
          indexedPages: report.visibility.indexedPages,
        }
      : null,
    visitors: report.visitors
      ? {
          users: report.visitors.users,
          pageViews: report.visitors.pageViews,
          averageEngagementTime: report.visitors.averageEngagementTime,
          topPage: report.visitors.topPage,
        }
      : null,
    results: report.results,
  };
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2), "utf-8");
  console.log("JSON report written to " + filePath);
}

export { jsonReport };