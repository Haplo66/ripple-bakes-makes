import * as fs from "node:fs";
import * as path from "node:path";
import type { DoctorConfig } from "../doctor-config.reader.ts";

type OwnerReportData = {
  generated: string;
  version: string;
  website: {
    score: number;
    maxScore: number;
    status: string;
    checks: { passed: number; warnings: number; failures: number };
  };
  business: {
    score: number;
    maxScore: number;
    status: string;
    products: {
      total: number;
      active: number;
      featured: number;
      missingDescriptions: number;
      missingShortDescriptions: number;
      missingPrices: number;
      productsWithOneImage: number;
      productsWithNoImages: number;
    };
    images: { total: number; averagePerProduct: number };
    forms: {
      available: number;
      uniqueReferenced: number;
      missing: number;
      productsLinked: number;
    };
  };
  healthTable: { check: string; result: string; status: string }[];
  recommendations: { priority: string; area: string; text: string }[];
};

type ProductAnalysisRow = {
  id: string;
  name: string;
  hasPrice: boolean;
  hasShortDescription: boolean;
  hasDescription: boolean;
  imageCount: number;
  imageScore: string;
  isFeatured: boolean;
  isHomepageFeatured: boolean;
  isGalleryFeatured: boolean;
  hasValidFormId: boolean | null;
};

function getEnv(name: string): string | undefined {
  return process.env[name];
}

function getLowestStatus(ws: string, bs: string): string {
  const rank = ["GOOD", "ATTENTION", "CRITICAL"];
  const w = rank.indexOf(ws);
  const b = rank.indexOf(bs);
  return rank[Math.max(w, b)];
}

function buildSubject(businessName: string, ws: string, bs: string): string {
  const overall = getLowestStatus(ws, bs);
  const label =
    overall === "GOOD"
      ? "ALL GOOD"
      : overall === "ATTENTION"
        ? "NEEDS ATTENTION"
        : "ACTION NEEDED";
  return (businessName || "RIPPLE") + " Health Report - " + label;
}

function businessStatusLabel(score: number, maxScore: number): string {
  const pct = Math.round((score / maxScore) * 100);
  if (pct >= 90) return "Excellent";
  if (pct >= 75) return "Good";
  if (pct >= 50) return "Improving";
  if (pct >= 25) return "Needs Attention";
  return "Getting Started";
}

function websiteStatusLabel(status: string): string {
  if (status === "GOOD") return "Healthy";
  if (status === "ATTENTION") return "Needs Attention";
  return "Action Needed";
}

function healthExplanation(status: string): string {
  if (status === "GOOD") return "Everything is functioning correctly.";
  if (status === "ATTENTION") return "Your website is operational, but some items need review.";
  return "Issues found that should be addressed.";
}

function businessExplanation(score: number, maxScore: number): string {
  const pct = Math.round((score / maxScore) * 100);
  if (pct >= 90) return "Your product catalog is in great shape.";
  if (pct >= 75) return "Most products are ready, with a few items to improve.";
  if (pct >= 50) return "Your website is operational, but product content should be improved.";
  if (pct >= 25) return "Several areas of your product catalog need attention.";
  return "Your product catalog needs significant improvements.";
}

function progressBar(filled: number, total: number, width: number): string {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  const filledCount = Math.round((pct / 100) * width);
  const emptyCount = width - filledCount;
  return "\u2588".repeat(Math.max(0, filledCount)) + "\u25A1".repeat(Math.max(0, emptyCount)) + " " + pct + "%";
}

function readProductAnalysis(): ProductAnalysisRow[] {
  const fullPath = path.resolve("scripts/doctor/reports/doctor-report.json");
  try {
    if (!fs.existsSync(fullPath)) return [];
    const raw = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    return raw.businessHealth?.productAnalysis ?? [];
  } catch {
    return [];
  }
}

function readCollectionsCount(): number {
  const p = path.resolve("src/content/collections.json");
  try {
    if (!fs.existsSync(p)) return 0;
    const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
    return Array.isArray(raw) ? raw.length : 0;
  } catch {
    return 0;
  }
}

function readBusinessProductMetrics(): { homepageFeatured: number; galleryFeatured: number } | null {
  const fullPath = path.resolve("scripts/doctor/reports/doctor-report.json");
  try {
    if (!fs.existsSync(fullPath)) return null;
    const raw = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    const prods = raw.businessHealth?.products;
    if (!prods) return null;
    return {
      homepageFeatured: prods.homepageFeatured ?? 0,
      galleryFeatured: prods.galleryFeatured ?? 0,
    };
  } catch {
    return null;
  }
}

function buildInventoryTableRows(): string[] {
  const analysis = readProductAnalysis();
  if (analysis.length === 0) return [];

  const lines: string[] = [];
  const header = "| Product | Images | Form | Price | Short | Description | Featured | Home | Gallery |";
  const sep = "|---------|--------|------|-------|-------|-------------|----------|------|---------|";
  lines.push(header);
  lines.push(sep);

  for (const p of analysis) {
    const icon = p.imageCount === 0 ? "\u2717" : p.imageCount === 1 ? "\u26A0" : "\u2713";
    const ok = "\u2713";
    const no = "\u2717";
    const row = [
      p.name,
      p.imageCount + " " + icon,
      p.hasValidFormId === true ? ok : p.hasValidFormId === false ? no : "\u2014",
      p.hasPrice ? ok : no,
      p.hasShortDescription ? ok : no,
      p.hasDescription ? ok : no,
      p.isFeatured ? ok : no,
      p.isHomepageFeatured ? ok : no,
      p.isGalleryFeatured ? ok : no,
    ];
    lines.push("| " + row.join(" | ") + " |");
  }

  return lines;
}

function buildBody(data: OwnerReportData, businessName: string, dashboardUrl: string): string {
  const lines: string[] = [];
  const p = data.business.products;
  const m = data.business;
  const ws = data.website;

  const header = businessName || "RIPPLE";

  lines.push("# " + header + " Bakes & Makes Health Report");
  lines.push("");
  lines.push("Generated: " + new Date(data.generated).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }));
  lines.push("");
  lines.push("----------------------------------------");
  lines.push("");
  lines.push("# Overall Health");
  lines.push("");
  lines.push("Website Health");
  lines.push("");
  lines.push("Score:");
  lines.push(ws.score + "/" + ws.maxScore);
  lines.push("");
  lines.push("Status:");
  lines.push(websiteStatusLabel(ws.status));
  lines.push("");
  lines.push(healthExplanation(ws.status));
  lines.push("");
  lines.push("Business Health");
  lines.push("");
  lines.push("Score:");
  lines.push(m.score + "/" + m.maxScore);
  lines.push("");
  lines.push("Status:");
  lines.push(businessStatusLabel(m.score, m.maxScore));
  lines.push("");
  lines.push(businessExplanation(m.score, m.maxScore));
  lines.push("");
  lines.push("----------------------------------------");
  lines.push("");
  lines.push("# Top Priorities");
  lines.push("");

  const priorities: { icon: string; label: string; detail: string }[] = [];

  if (p.missingDescriptions > 0) {
    priorities.push({ icon: "\uD83D\uDD34", label: "Product Descriptions", detail: p.missingDescriptions + " products missing." });
  }

  const needingImages = p.productsWithOneImage + p.productsWithNoImages;
  if (needingImages > 0) {
    priorities.push({ icon: "\uD83D\uDFE1", label: "Product Images", detail: needingImages + " products need additional images." });
  }

  if (p.missingShortDescriptions > 0) {
    priorities.push({ icon: "\uD83D\uDFE1", label: "Short Descriptions", detail: p.missingShortDescriptions + " products missing." });
  }

  if (p.missingPrices > 0) {
    priorities.push({ icon: "\uD83D\uDD34", label: "Product Pricing", detail: p.missingPrices + " products missing price." });
  }

  if (data.business.forms.missing > 0) {
    priorities.push({ icon: "\uD83D\uDFE1", label: "Order Forms", detail: data.business.forms.missing + " products missing form reference." });
  }

  if (priorities.length === 0) {
    lines.push("No issues found. Everything looks good!");
  } else {
    for (const pri of priorities) {
      lines.push(pri.icon + " " + pri.label);
      lines.push(pri.detail);
      lines.push("");
    }
  }

  lines.push("----------------------------------------");
  lines.push("");
  lines.push("# Business Metrics");
  lines.push("");

  const collectionsCount = readCollectionsCount();
  const fullMetrics = readBusinessProductMetrics();

  const metrics: [string, number | string][] = [
    ["Total Products", p.total],
    ["Active Products", p.active],
    ["Collections", collectionsCount],
    ["Forms", data.business.forms.available],
    ["Featured Products", p.featured],
    ["Homepage Featured", fullMetrics?.homepageFeatured ?? "\u2014"],
    ["Gallery Featured", fullMetrics?.galleryFeatured ?? "\u2014"],
    ["Average Images/Product", data.business.images.averagePerProduct.toFixed(1)],
    ["Missing Descriptions", p.missingDescriptions],
    ["Missing Short Desc", p.missingShortDescriptions],
    ["Products Needing Images", needingImages],
  ];

  const labelWidth = Math.max(...metrics.map((r) => r[0].length));
  for (const [label, value] of metrics) {
    lines.push(label.padEnd(labelWidth) + "  " + value);
  }

  lines.push("");
  lines.push("----------------------------------------");
  lines.push("");
  lines.push("# Progress");
  lines.push("");

  const barWidth = 20;
  const descFilled = p.total - p.missingDescriptions;
  const shortFilled = p.total - p.missingShortDescriptions;
  const imagesFilled = p.total - needingImages;

  lines.push("Products");
  lines.push(progressBar(p.active, p.total, barWidth) + " (" + p.active + "/" + p.total + ")");
  lines.push("");
  lines.push("Descriptions");
  lines.push(progressBar(descFilled, p.total, barWidth) + " (" + descFilled + "/" + p.total + ")");
  lines.push("");
  lines.push("Short Descriptions");
  lines.push(progressBar(shortFilled, p.total, barWidth) + " (" + shortFilled + "/" + p.total + ")");
  lines.push("");
  lines.push("Images (\u22652)");
  lines.push(progressBar(imagesFilled, p.total, barWidth) + " (" + imagesFilled + "/" + p.total + ")");
  lines.push("");
  lines.push("----------------------------------------");
  lines.push("");
  lines.push("# Product Inventory");
  lines.push("");

  const tableRows = buildInventoryTableRows();
  if (tableRows.length > 0) {
    for (const r of tableRows) {
      lines.push(r);
    }
    lines.push("");
  }

  const url = dashboardUrl || "https://haplo66.github.io/ripple-bakes-makes/doctor";
  lines.push("Dashboard: " + url);

  return lines.join("\n");
}

async function postToAppsScript(payload: unknown): Promise<Response> {
  const endpoint = getEnv("PUBLIC_SUBMISSION_ENDPOINT");
  if (!endpoint) {
    throw new Error("PUBLIC_SUBMISSION_ENDPOINT is not set");
  }
  return fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function sendEmail(
  data: OwnerReportData,
  config: DoctorConfig,
): Promise<void> {
  const token = getEnv("PUBLIC_ORDER_TOKEN");
  if (!token) {
    console.log("  \u2139 Email delivery skipped - PUBLIC_ORDER_TOKEN not set");
    return;
  }

  const recipients = config.reportEmails.join(", ");
  if (!recipients) {
    console.log("  \u2139 Email delivery skipped - no recipients configured");
    return;
  }

  const businessName = config.businessName || "RIPPLE";
  const dashboardUrl = config.dashboardUrl || "";
  const subject = buildSubject(businessName, data.website.status, data.business.status);
  const body = buildBody(data, businessName, dashboardUrl);

  const response = await postToAppsScript({
    doctor: { recipients, subject, body },
    token,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "no body");
    throw new Error("Apps Script returned " + response.status + ": " + text);
  }
}

async function emailReport(config: DoctorConfig | null): Promise<void> {
  const doctorEnabled = config ? config.doctorEnabled : false;

  if (!doctorEnabled) {
    console.log("  \u2139 Email delivery skipped - not configured (set Doctor Enabled = Yes in Doctor Config sheet)");
    return;
  }

  const reportEmails = config ? config.reportEmails : [];
  if (reportEmails.length === 0) {
    console.log("  \u2139 Email delivery skipped - no recipient emails configured (set Report Emails in Doctor Config sheet)");
    return;
  }

  const reportsDir = path.resolve("scripts/doctor/reports");
  const ownerPath = path.join(reportsDir, "doctor-report-owner.json");

  if (!fs.existsSync(ownerPath)) {
    console.log("  \u2139 Email delivery skipped - owner report not found");
    return;
  }

  const data = JSON.parse(
    fs.readFileSync(ownerPath, "utf-8"),
  ) as OwnerReportData;

  try {
    await sendEmail(data, config);
    console.log("  \u2713 Email sent to " + config.reportEmails.join(", "));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("  \u2717 Email delivery failed: " + msg);
  }
}

export { emailReport };
