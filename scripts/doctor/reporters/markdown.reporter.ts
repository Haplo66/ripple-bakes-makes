import type { DoctorResult, DoctorReport } from "../types.ts";
import type { BusinessHealthResult } from "../business.ts";
import * as fs from "node:fs";
import * as path from "node:path";

function markdownReport(report: DoctorReport): void {
  const bh = report.businessHealth as unknown as BusinessHealthResult;
  const reportsDir = path.resolve("scripts/doctor/reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  const filePath = path.join(reportsDir, "doctor-report.md");

const lines: string[] = [];
  lines.push("# RIPPLE Doctor Report");
  lines.push("");
  lines.push("Generated: " + report.timestamp);
  lines.push("Version: " + report.version);
  lines.push("Commit: " + report.commit);
  lines.push("");
  lines.push("## Website Health");
  lines.push("");
  lines.push("### Health Score");
  lines.push("");
  lines.push("Score: " + report.websiteHealth.score + "/" + report.websiteHealth.maxScore);
  lines.push("Status: " + report.websiteHealth.status);
  lines.push("");
  lines.push("### Summary");
  lines.push("| Status | Count |");
  lines.push("|--------|-------|");
  lines.push("| PASS   | " + report.summary.pass + " |");
  lines.push("| WARN   | " + report.summary.warn + " |");
  lines.push("| FAIL   | " + report.summary.fail + " |");
  lines.push("| INFO   | " + report.summary.info + " |");
  lines.push("");
  if (report.websiteHealth.recommendations.length > 0) {
    lines.push("### Recommendations");
    lines.push("");
    for (const rec of report.websiteHealth.recommendations) {
      lines.push("- [" + rec.id + "] " + rec.text);
    }
    lines.push("");
  }
  lines.push("### Results");
  lines.push("");

  for (const result of report.results) {
    lines.push("#### " + result.id + ": " + result.summary);
    lines.push("");
    lines.push("- **Category:** " + result.category);
    lines.push("- **Status:** " + result.status);
    lines.push("");
    if (result.details && result.details.length > 0) {
      lines.push("**Details:**");
      for (const d of result.details) {
        lines.push("- " + d);
      }
      lines.push("");
    }
    if (result.recommendation) {
      lines.push("**Recommendation:** " + result.recommendation);
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");
  lines.push("## Business Health");
  lines.push("");
  lines.push("### Catalog Score");
  lines.push("");
  lines.push("Score: " + bh.score + "/" + bh.maxScore);
  lines.push("Status: " + bh.status);
  lines.push("");

  const m = bh.metrics;
  lines.push("### Product Inventory");
  lines.push("");
  lines.push("| Product | Images | Form | Price | Short | Description | Featured | Home | Gallery |");
  lines.push("|---------|--------|------|-------|-------|-------------|----------|------|---------|");
  for (const p of bh.productAnalysis) {
    const icon = p.imageScore === "FAIL" ? "FAIL" : p.imageScore === "WARN" ? "WARN" : "OK";
    const form = p.hasValidFormId === null ? "\u2014" : p.hasValidFormId ? "OK" : "MISS";
    const price = p.hasPrice ? "OK" : "MISS";
    const short = p.hasShortDescription ? "OK" : "MISS";
    const desc = p.hasDescription ? "OK" : "MISS";
    const feat = p.isFeatured ? "OK" : "";
    const home = p.isHomepageFeatured ? "OK" : "";
    const gal = p.isGalleryFeatured ? "OK" : "";
    lines.push("| " + p.name + " | " + p.imageCount + " " + icon + " | " + form + " | " + price + " | " + short + " | " + desc + " | " + feat + " | " + home + " | " + gal + " |");
  }
  lines.push("");

  lines.push("### Images");
  lines.push("");
  lines.push("- Total product images: " + m.totalImages);
  lines.push("- Average images/product: " + m.averageImagesPerProduct);
  lines.push("- Products without images: " + m.productsWithNoImages);
  lines.push("- Products needing more images: " + m.productsWithOneImage);
  lines.push("");

  lines.push("### Forms");
  lines.push("");
  lines.push("- Products requiring forms: " + bh.formCoverage.productsWithForms);
  lines.push("- Valid form IDs: " + bh.formCoverage.uniqueFormIds);
  lines.push("- Valid forms: " + bh.formCoverage.valid);
  if (bh.formCoverage.missing > 0) {
    lines.push("- Missing: " + bh.formCoverage.missing);
    lines.push("  - " + bh.formCoverage.missingIds.join(", "));
  }
  lines.push("");

  lines.push("### Business Metrics");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|--------|-------|");
  lines.push("| Total Products | " + m.totalProducts + " |");
  lines.push("| Active Products | " + m.activeProducts + " |");
  lines.push("| Featured Products | " + m.featuredProducts + " |");
  lines.push("| Homepage Featured | " + m.homepageFeatured + " |");
  lines.push("| Gallery Featured | " + m.galleryFeatured + " |");
  lines.push("| Average Images/Product | " + m.averageImagesPerProduct + " |");
  lines.push("| Missing Short Descriptions | " + m.missingShortDescriptions + " |");
  lines.push("| Missing Descriptions | " + m.missingDescriptions + " |");
  lines.push("");

  if (bh.recommendations.length > 0) {
    lines.push("### Recommendations");
    lines.push("");
    const high = bh.recommendations.filter(r => r.priority === "HIGH");
    const med = bh.recommendations.filter(r => r.priority === "MEDIUM");
    if (high.length > 0) {
      lines.push("**HIGH PRIORITY**");
      for (const r of high) {
        lines.push("- " + r.text);
      }
      lines.push("");
    }
    if (med.length > 0) {
      lines.push("**MEDIUM PRIORITY**");
      for (const r of med) {
        lines.push("- " + r.text);
      }
      lines.push("");
    }
  }

  fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
  console.log("Markdown report written to " + filePath);
}

export { markdownReport };
