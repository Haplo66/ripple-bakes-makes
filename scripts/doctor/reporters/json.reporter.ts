/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import type { DoctorReport } from "../types.ts";
import type { BusinessHealthByArea, BusinessHealthResult } from "../business.ts";
import * as fs from "node:fs";
import * as path from "node:path";

function jsonReport(report: DoctorReport): void {
  const bh = report.businessHealth as unknown as BusinessHealthByArea;
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
    businessHealth: Object.fromEntries(
      Object.entries(bh).map(([area, areaBh]) => [
        area,
        {
          score: areaBh.score,
          maxScore: areaBh.maxScore,
          status: areaBh.status,
          products: {
            total: areaBh.metrics.totalProducts,
            active: areaBh.metrics.activeProducts,
            featured: areaBh.metrics.featuredProducts,
            homepageFeatured: areaBh.metrics.homepageFeatured,
            galleryFeatured: areaBh.metrics.galleryFeatured,
            missingDescriptions: areaBh.metrics.missingDescriptions,
            missingShortDescriptions: areaBh.metrics.missingShortDescriptions,
            missingPrices: areaBh.metrics.missingPrices,
            totalImages: areaBh.metrics.totalImages,
            averageImagesPerProduct: areaBh.metrics.averageImagesPerProduct,
            productsWithNoImages: areaBh.metrics.productsWithNoImages,
            productsWithOneImage: areaBh.metrics.productsWithOneImage,
          },
          forms: {
            productsWithForms: areaBh.formCoverage.productsWithForms,
            uniqueFormIds: areaBh.formCoverage.uniqueFormIds,
            valid: areaBh.formCoverage.valid,
            missing: areaBh.formCoverage.missing,
            missingIds: areaBh.formCoverage.missingIds,
          },
          productAnalysis: areaBh.productAnalysis.map((p) => ({
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
          recommendations: areaBh.recommendations.map((r) => ({ priority: r.priority, text: r.text })),
        },
      ]),
    ),
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