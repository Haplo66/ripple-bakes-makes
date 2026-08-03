/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import type { DoctorResult, DoctorReport } from "../types.ts";
import type { BusinessHealthByArea, BusinessHealthResult } from "../business.ts";

function consoleReport(report: DoctorReport): void {
  const bh = report.businessHealth as unknown as BusinessHealthByArea;

  console.log("\nRIPPLE Doctor\n");

  console.log("====================");
  console.log("Website Health");
  console.log("====================");

  for (const result of report.results) {
    const icon = result.status === "PASS" ? "\u2713" : result.status === "WARN" ? "\u26A0" : result.status === "FAIL" ? "\u2717" : "\u2139";
    if (result.status === "PASS" || result.status === "INFO") {
      console.log(icon + " " + result.summary);
    } else {
      console.log(icon + " " + result.summary);
      if (result.details) {
        result.details.forEach((d) => console.log("  " + d));
      }
      if (result.recommendation) {
        console.log("  -> " + result.recommendation);
      }
    }
  }

  const hs = report.websiteHealth;
  console.log("\nHealth Score:");
  console.log("  " + hs.score + "/" + hs.maxScore);
  console.log("\nStatus:");
  console.log("  " + hs.status);

  console.log("\nSummary:");
  console.log("  PASS: " + report.summary.pass);
  console.log("  WARN: " + report.summary.warn);
  console.log("  FAIL: " + report.summary.fail);
  console.log("  INFO: " + report.summary.info);

  if (hs.recommendations.length > 0) {
    console.log("\nRecommendations:");
    for (const rec of hs.recommendations) {
      console.log("  - " + rec.text);
    }
  }

  console.log("");
  console.log("====================");
  console.log("Business Health by Area");
  console.log("====================");
  console.log("");

  const areas = Object.keys(bh).sort();
  for (const area of areas) {
    const areaBh = bh[area];
    const areaLabel = area === "bakery" ? "Bakery" : area === "sewing" ? "Sewing" : area;
    console.log(areaLabel);
    console.log("");
    console.log("  Catalog Score: " + areaBh.score + "/" + areaBh.maxScore);
    console.log("  Status: " + areaBh.status);
    console.log("");

    const m = areaBh.metrics;
    console.log("  Products: " + m.totalProducts);
    console.log("  Total Images: " + m.totalImages);
    console.log("  Average Images/Product: " + m.averageImagesPerProduct);
    console.log("  Products without images: " + m.productsWithNoImages);
    console.log("  Missing Short Descriptions: " + m.missingShortDescriptions);
    console.log("  Missing Descriptions: " + m.missingDescriptions);
    console.log("  Missing Prices: " + m.missingPrices);
    console.log("");

    if (areaBh.recommendations.length > 0) {
      console.log("  Recommendations:");
      for (const rec of areaBh.recommendations) {
        console.log("    - [" + rec.priority + "] " + rec.text);
      }
      console.log("");
    }
  }

  if (report.visibility) {
    console.log("====================");
    console.log("Visibility");
    console.log("====================");
    console.log("");
    console.log("Search Impressions: " + (report.visibility.impressions != null ? report.visibility.impressions.toLocaleString() : "Unavailable"));
    console.log("Search Clicks: " + (report.visibility.clicks != null ? report.visibility.clicks.toLocaleString() : "Unavailable"));
    console.log("Average Position: " + (report.visibility.averagePosition != null ? report.visibility.averagePosition.toFixed(1) : "Unavailable"));
    console.log("Indexed Pages: " + (report.visibility.indexedPages != null ? report.visibility.indexedPages.toLocaleString() : "Unavailable"));
    console.log("");
  }

  if (report.visitors) {
    console.log("====================");
    console.log("Visitors");
    console.log("====================");
    console.log("");
    console.log("Users: " + (report.visitors.users != null ? report.visitors.users.toLocaleString() : "Unavailable"));
    console.log("Page Views: " + (report.visitors.pageViews != null ? report.visitors.pageViews.toLocaleString() : "Unavailable"));
    const eng = report.visitors.averageEngagementTime;
    console.log("Avg Engagement Time: " + (eng != null ? Math.round(eng) + "s" : "Unavailable"));
    console.log("Top Page: " + (report.visitors.topPage ?? "Unavailable"));
    console.log("");
  }
}

export { consoleReport };