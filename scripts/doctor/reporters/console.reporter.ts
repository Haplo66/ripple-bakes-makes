import type { DoctorResult, DoctorReport } from "../types.ts";
import type { BusinessHealthResult } from "../business.ts";

function consoleReport(report: DoctorReport): void {
  const bh = report.businessHealth as unknown as BusinessHealthResult;

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
  console.log("Business Health");
  console.log("====================");
  console.log("");
  console.log("Catalog Score:");
  console.log("  " + bh.score + "/" + bh.maxScore);
  console.log("Status: " + bh.status);
  console.log("");

  const m = bh.metrics;
  console.log("Products: " + m.totalProducts);
  console.log("Collections: " + (report.results.find(r => r.id === "DATA-002")?.summary.match(/\d+/) || ["?"])[0]);
  console.log("Forms: " + (report.results.find(r => r.id === "DATA-003")?.summary.match(/\d+/) || ["?"])[0]);
  console.log("");

  console.log("Product Inventory");
  console.log("");

  const header = "| Product | Images | Form | Price | Short | Description | Featured | Home | Gallery |";
  const sep = "|---------|--------|------|-------|-------|-------------|----------|------|---------|";
  console.log(header);
  console.log(sep);
  for (const p of bh.productAnalysis) {
    const icon = p.imageScore === "FAIL" ? "\u2717" : p.imageScore === "WARN" ? "\u26A0" : "\u2713";
    const form = p.hasValidFormId === null ? "\u2014" : p.hasValidFormId ? "\u2713" : "\u2717";
    const price = p.hasPrice ? "\u2713" : "\u2717";
    const short = p.hasShortDescription ? "\u2713" : "\u2717";
    const desc = p.hasDescription ? "\u2713" : "\u2717";
    const feat = p.isFeatured ? "\u2713" : "\u2717";
    const home = p.isHomepageFeatured ? "\u2713" : "\u2717";
    const gal = p.isGalleryFeatured ? "\u2713" : "\u2717";
    console.log("| " + p.name + " | " + p.imageCount + " " + icon + " | " + form + " | " + price + " | " + short + " | " + desc + " | " + feat + " | " + home + " | " + gal + " |");
  }
  console.log("");

  console.log("Images");
  console.log("");
  console.log("Total product images: " + m.totalImages);
  console.log("Average images/product: " + m.averageImagesPerProduct);
  console.log("Products without images: " + m.productsWithNoImages);
  console.log("Products needing more images: " + m.productsWithOneImage);
  console.log("");

  console.log("Forms");
  console.log("");
  console.log("Products requiring forms: " + bh.formCoverage.productsWithForms);
  console.log("Valid form IDs: " + bh.formCoverage.uniqueFormIds);
  console.log("Valid forms: " + bh.formCoverage.valid);
  if (bh.formCoverage.missing > 0) {
    console.log("Missing: " + bh.formCoverage.missing);
    console.log("  " + bh.formCoverage.missingIds.join(", "));
  }
  console.log("");

  console.log("Business Metrics");
  console.log("");
  console.log("Total Products: " + m.totalProducts);
  console.log("Active Products: " + m.activeProducts);
  console.log("Featured Products: " + m.featuredProducts);
  console.log("Homepage Featured: " + m.homepageFeatured);
  console.log("Gallery Featured: " + m.galleryFeatured);
  console.log("Average Images/Product: " + m.averageImagesPerProduct);
  console.log("Missing Short Descriptions: " + m.missingShortDescriptions);
  console.log("Missing Descriptions: " + m.missingDescriptions);
  console.log("");

  if (bh.recommendations.length > 0) {
    console.log("Recommendations");
    console.log("");
    const high = bh.recommendations.filter(r => r.priority === "HIGH");
    const med = bh.recommendations.filter(r => r.priority === "MEDIUM");
    if (high.length > 0) {
      console.log("HIGH PRIORITY");
      for (const r of high) {
        console.log("  - " + r.text);
      }
      console.log("");
    }
    if (med.length > 0) {
      console.log("MEDIUM PRIORITY");
      for (const r of med) {
        console.log("  - " + r.text);
      }
      console.log("");
    }
  }
}

export { consoleReport };