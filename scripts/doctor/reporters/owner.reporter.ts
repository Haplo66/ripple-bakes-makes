/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import type { DoctorReport } from "../types.ts";
import type { BusinessHealthByArea, BusinessHealthResult } from "../business.ts";
import { buildOverallBusinessHealth } from "../business.ts";
import * as fs from "node:fs";
import * as path from "node:path";

type OwnerHealthTableRow = {
  check: string;
  result: string;
  status: "Good" | "Needs attention" | "Critical";
};

function buildHealthTable(
  report: DoctorReport,
  bh: BusinessHealthResult,
  areaLabel: string,
): OwnerHealthTableRow[] {
  const rows: OwnerHealthTableRow[] = [];

  const wh = report.websiteHealth;
  rows.push({
    check: areaLabel + " - Website configuration & pipeline",
    result: wh.score + "/" + wh.maxScore + " — " + report.summary.pass + " of " + report.summary.total + " checks pass",
    status: wh.status === "GOOD" ? "Good" : wh.status === "ATTENTION" ? "Needs attention" : "Critical",
  });

  const m = bh.metrics;
  rows.push({
    check: areaLabel + " - Product descriptions",
    result: m.missingDescriptions > 0 ? m.missingDescriptions + " missing" : "All present",
    status: m.missingDescriptions > 0 ? "Needs attention" : "Good",
  });

  rows.push({
    check: areaLabel + " - Product short descriptions",
    result: m.missingShortDescriptions > 0 ? m.missingShortDescriptions + " missing" : "All present",
    status: m.missingShortDescriptions > 0 ? "Needs attention" : "Good",
  });

  rows.push({
    check: areaLabel + " - Product images",
    result: m.productsWithOneImage > 0 ? m.productsWithOneImage + " products need more images" : "All good",
    status: m.productsWithOneImage > 0 || m.productsWithNoImages > 0 ? "Needs attention" : "Good",
  });

  rows.push({
    check: areaLabel + " - Product pricing",
    result: m.missingPrices > 0 ? m.missingPrices + " products missing price" : "All products priced",
    status: m.missingPrices > 0 ? "Critical" : "Good",
  });

  rows.push({
    check: areaLabel + " - Forms & ordering",
    result: bh.formCoverage.valid + "/" + bh.formCoverage.uniqueFormIds + " available" + (bh.formCoverage.missing > 0 ? " (" + bh.formCoverage.missing + " missing)" : ""),
    status: bh.formCoverage.missing > 0 ? "Needs attention" : "Good",
  });

  rows.push({
    check: areaLabel + " - Featured products",
    result: m.featuredProducts + " featured, " + m.homepageFeatured + " on homepage",
    status: m.homepageFeatured >= 3 ? "Good" : "Needs attention",
  });

  return rows;
}

function buildOwnerRecommendations(
  bh: BusinessHealthResult,
  areaLabel: string,
): { priority: string; area: string; text: string }[] {
  const recs: { priority: string; area: string; text: string }[] = [];
  for (const r of bh.recommendations) {
    const area = r.text.includes("image") ? "Images" : r.text.includes("description") ? "Descriptions" : r.text.includes("form") ? "Forms" : "General";
    recs.push({ priority: r.priority, area: areaLabel + " - " + area, text: r.text });
  }
  return recs;
}

function ownerReport(report: DoctorReport): void {
  const bh = report.businessHealth as unknown as BusinessHealthByArea;
  const reportsDir = path.resolve("scripts/doctor/reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const allHealthTable: OwnerHealthTableRow[] = [];
  const allRecommendations: { priority: string; area: string; text: string }[] = [];
  const overall = buildOverallBusinessHealth(bh);
  const businessAreas: Record<string, { score: number; maxScore: number; status: string; products: Record<string, number>; images: Record<string, number>; forms: Record<string, number> }> = {};

  const areas = Object.keys(bh).sort();
  for (const area of areas) {
    const areaBh = bh[area];
    const areaLabel = area === "bakery" ? "Bakery" : area === "sewing" ? "Sewing" : area;

    const m = areaBh.metrics;
    businessAreas[area] = {
      score: areaBh.score,
      maxScore: areaBh.maxScore,
      status: areaBh.status,
      products: {
        total: m.totalProducts,
        active: m.activeProducts,
        featured: m.featuredProducts,
        missingDescriptions: m.missingDescriptions,
        missingShortDescriptions: m.missingShortDescriptions,
        missingPrices: m.missingPrices,
        productsWithOneImage: m.productsWithOneImage,
        productsWithNoImages: m.productsWithNoImages,
      },
      images: {
        total: m.totalImages,
        averagePerProduct: m.averageImagesPerProduct,
      },
      forms: {
        available: areaBh.formCoverage.valid,
        uniqueReferenced: areaBh.formCoverage.uniqueFormIds,
        missing: areaBh.formCoverage.missing,
        productsLinked: areaBh.formCoverage.productsWithForms,
      },
    };

    allHealthTable.push(...buildHealthTable(report, areaBh, areaLabel));
    allRecommendations.push(...buildOwnerRecommendations(areaBh, areaLabel));
  }

  const overallScore = overall.score;
  const overallMax = overall.maxScore;
  const overallStatus = overall.status;

  const output = {
    generated: report.timestamp,
    version: report.version,
    website: {
      score: report.websiteHealth.score,
      maxScore: report.websiteHealth.maxScore,
      status: report.websiteHealth.status,
      checks: {
        passed: report.summary.pass,
        warnings: report.summary.warn,
        failures: report.summary.fail,
      },
    },
    business: {
      overall: {
        score: overallScore,
        maxScore: overallMax,
        status: overallStatus,
      },
      byArea: businessAreas,
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
    healthTable: allHealthTable,
    recommendations: allRecommendations,
  };

  const filePath = path.join(reportsDir, "doctor-report-owner.json");
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2), "utf-8");
  console.log("Owner report written to " + filePath);
}

export { ownerReport };
