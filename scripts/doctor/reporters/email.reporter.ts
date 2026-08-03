/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

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
    overall: {
      score: number;
      maxScore: number;
      status: string;
    };
    byArea: Record<string, {
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
    }>;
  };
  visibility: {
    impressions: number | null;
    clicks: number | null;
    averagePosition: number | null;
    indexedPages: number | null;
  } | null;
  visitors: {
    users: number | null;
    pageViews: number | null;
    averageEngagementTime: number | null;
    topPage: string | null;
  } | null;
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

function readProductAnalysis(): ProductAnalysisRow[] {
  const fullPath = path.resolve("scripts/doctor/reports/doctor-report.json");
  try {
    if (!fs.existsSync(fullPath)) return [];
    const raw = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    const bh = raw.businessHealth;
    if (!bh) return [];
    const all: ProductAnalysisRow[] = [];
    for (const area of Object.keys(bh).sort()) {
      all.push(...(bh[area].productAnalysis ?? []));
    }
    return all;
  } catch {
    return [];
  }
}

function readProductAnalysisByArea(areaKey: string): ProductAnalysisRow[] {
  const fullPath = path.resolve("scripts/doctor/reports/doctor-report.json");
  try {
    if (!fs.existsSync(fullPath)) return [];
    const raw = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    const bh = raw.businessHealth;
    if (!bh || !bh[areaKey]) return [];
    return bh[areaKey].productAnalysis ?? [];
  } catch {
    return [];
  }
}

function readCollectionsCount(): number {
  const p = path.resolve("src/content/collections.json");
  try {
    if (!fs.existsSync(p)) return 0;
    const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
    return Array.isArray(raw.data) ? raw.data.length : 0;
  } catch {
    return 0;
  }
}

function readBusinessProductMetrics(): { homepageFeatured: number; galleryFeatured: number } | null {
  const fullPath = path.resolve("scripts/doctor/reports/doctor-report.json");
  try {
    if (!fs.existsSync(fullPath)) return null;
    const raw = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
    const bh = raw.businessHealth;
    if (!bh) return null;
    let homepageFeatured = 0;
    let galleryFeatured = 0;
    for (const area of Object.keys(bh).sort()) {
      const prods = bh[area].products;
      if (prods) {
        homepageFeatured += prods.homepageFeatured ?? 0;
        galleryFeatured += prods.galleryFeatured ?? 0;
      }
    }
    return { homepageFeatured, galleryFeatured };
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function escHtml(s: string | number): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Plain text fallback ─────────────────────────────────────────

function buildPlainTextBody(data: OwnerReportData, businessName: string, dashboardUrl: string): string {
  const areas = data.business.byArea;
  const ws = data.website;
  const header = businessName || "RIPPLE";

  const lines: string[] = [];

  lines.push(header + " Health Report");
  lines.push("Generated: " + formatDate(data.generated));
  lines.push("");
  lines.push("Website Health: " + ws.score + "/" + ws.maxScore + " " + websiteStatusLabel(ws.status));
  lines.push("Business Health: " + overallScore + "/" + overallMax + " " + businessStatusLabel(overallScore, overallMax));
  lines.push("");

  for (const areaKey of Object.keys(areas).sort()) {
    const area = areas[areaKey];
    const areaLabel = areaKey === "bakery" ? "Bakery" : areaKey === "sewing" ? "Sewing" : areaKey;
    const p = area.products;

    lines.push("--- " + areaLabel + " ---");
    if (p.missingDescriptions > 0) lines.push("Product Descriptions: " + p.missingDescriptions + " missing");
    if (p.missingShortDescriptions > 0) lines.push("Short Descriptions: " + p.missingShortDescriptions + " missing");
    const needingImages = p.productsWithOneImage + p.productsWithNoImages;
    if (needingImages > 0) lines.push("Product Images: " + needingImages + " need attention");
    if (p.missingPrices > 0) lines.push("Product Pricing: " + p.missingPrices + " missing price");
    lines.push("");
  }

  lines.push("--- Visibility ---");
  if (data.visibility) {
    lines.push("Search Impressions: " + (data.visibility.impressions != null ? data.visibility.impressions.toLocaleString() : "Unavailable"));
    lines.push("Search Clicks: " + (data.visibility.clicks != null ? data.visibility.clicks.toLocaleString() : "Unavailable"));
    lines.push("Average Position: " + (data.visibility.averagePosition != null ? data.visibility.averagePosition.toFixed(1) : "Unavailable"));
    lines.push("Indexed Pages: " + (data.visibility.indexedPages != null ? data.visibility.indexedPages.toLocaleString() : "Unavailable"));
  } else {
    lines.push("Visibility data unavailable.");
  }
  lines.push("");
  lines.push("--- Visitors ---");
  if (data.visitors) {
    lines.push("Users: " + (data.visitors.users != null ? data.visitors.users.toLocaleString() : "Unavailable"));
    lines.push("Page Views: " + (data.visitors.pageViews != null ? data.visitors.pageViews.toLocaleString() : "Unavailable"));
    const eng = data.visitors.averageEngagementTime;
    lines.push("Avg Engagement Time: " + (eng != null ? Math.round(eng) + "s" : "Unavailable"));
    lines.push("Top Page: " + (data.visitors.topPage ?? "Unavailable"));
  } else {
    lines.push("Visitors data unavailable.");
  }

  lines.push("");
  const url = dashboardUrl || "https://haplo66.github.io/ripple-bakes-makes/doctor";
  lines.push("Dashboard: " + url);

  return lines.join("\n");
}

// ─── HTML body ───────────────────────────────────────────────────

function buildHtmlBody(data: OwnerReportData, businessName: string, dashboardUrl: string): string {
  const areas = data.business.byArea;
  const ws = data.website;
  const header = businessName || "RIPPLE";

  const areaKeys = Object.keys(areas).sort();
  const areaLabels: Record<string, string> = { bakery: "Bakery", sewing: "Sewing" };

  const areaValues = Object.values(areas);
  const overallScore = areaValues.length > 0
    ? Math.round(areaValues.reduce((sum, a) => sum + a.score, 0) / areaValues.length)
    : 0;
  const overallMax = 100;
  const overallStatus = overallScore >= 90 ? "GOOD" : overallScore >= 70 ? "ATTENTION" : "CRITICAL";

  let totalProducts = 0;
  let totalMissingDescriptions = 0;
  let totalMissingShortDescriptions = 0;
  let totalMissingPrices = 0;
  let totalWithOneImage = 0;
  let totalWithNoImages = 0;
  let totalFormsMissing = 0;
  let totalAvgImages = 0;

  for (const key of areaKeys) {
    const a = areas[key];
    totalProducts += a.products.total;
    totalMissingDescriptions += a.products.missingDescriptions;
    totalMissingShortDescriptions += a.products.missingShortDescriptions;
    totalMissingPrices += a.products.missingPrices;
    totalWithOneImage += a.products.productsWithOneImage;
    totalWithNoImages += a.products.productsWithNoImages;
    totalFormsMissing += a.forms.missing;
    totalAvgImages += a.images.averagePerProduct;
  }

  const needingImages = totalWithOneImage + totalWithNoImages;
  const collectionsCount = readCollectionsCount();
  const fullMetrics = readBusinessProductMetrics();

  const dateStr = formatDate(data.generated);

  const primary = "#5a3e36";
  const warmBg = "#faf8f6";
  const accent = "#e8d5c4";
  const muted = "#8a7a6a";
  const green = "#4a9e5c";
  const amber = "#d97706";
  const red = "#dc2626";

  const wsStatusLabel = websiteStatusLabel(ws.status);
  const wsColor = ws.status === "GOOD" ? green : ws.status === "ATTENTION" ? amber : red;

  const bsLabel = businessStatusLabel(overallScore, overallMax);
  let bsColor = red;
  const bsPct = overallScore / overallMax;
  if (bsPct >= 0.9) bsColor = green;
  else if (bsPct >= 0.75) bsColor = "#6b8e5a";
  else if (bsPct >= 0.5) bsColor = amber;

  // ── Priority cards ──────────────────────────────────────────────

  const priorities: { icon: string; label: string; detail: string; color: string }[] = [];

  if (totalMissingDescriptions > 0) {
    priorities.push({
      icon: "&#128221;",
      label: "Product Descriptions",
      detail: totalMissingDescriptions + " products need descriptions.",
      color: red,
    });
  }

  if (needingImages > 0) {
    priorities.push({
      icon: "&#128248;",
      label: "Product Images",
      detail: needingImages + " products need additional images.",
      color: amber,
    });
  }

  if (totalMissingShortDescriptions > 0) {
    priorities.push({
      icon: "&#128196;",
      label: "Short Descriptions",
      detail: totalMissingShortDescriptions + " products missing short descriptions.",
      color: amber,
    });
  }

  if (totalMissingPrices > 0) {
    priorities.push({
      icon: "&#128176;",
      label: "Product Pricing",
      detail: totalMissingPrices + " products missing price.",
      color: red,
    });
  }

  if (totalFormsMissing > 0) {
    priorities.push({
      icon: "&#128203;",
      label: "Order Forms",
      detail: totalFormsMissing + " products missing form reference.",
      color: amber,
    });
  }

  // ── Product inventory (needing attention vs complete) ─────────

  const analysis = readProductAnalysis();
  const needingAttention: ProductAnalysisRow[] = [];
  const complete: ProductAnalysisRow[] = [];

  for (const pr of analysis) {
    const issues: string[] = [];
    if (pr.imageCount <= 1) issues.push("image");
    if (!pr.hasDescription) issues.push("description");
    if (!pr.hasShortDescription) issues.push("short description");
    if (!pr.hasPrice) issues.push("price");
    if (pr.hasValidFormId === false) issues.push("form");
    if (issues.length > 0) {
      needingAttention.push(pr);
    } else {
      complete.push(pr);
    }
  }

  // ── Build HTML ────────────────────────────────────────────────

  const h = (...parts: (string | number)[]) => parts.join("");

  function cardCell(score: number, max: number, label: string, color: string, explanation: string, halfWidth: boolean): string {
    const w = halfWidth ? '50%' : '50%';
    return h(
      '<td width="', w, '" style="vertical-align:top; padding:8px; background:', warmBg, '; border:1px solid ', accent, '; border-radius:8px; text-align:center;">',
      '<p style="color:', muted, '; margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px;">', escHtml(label), '</p>',
      '<p style="font-size:32px; font-weight:bold; color:', primary, '; margin:8px 0 4px;">', escHtml(score), '/', escHtml(max), '</p>',
       '<p style="color:', color, '; margin:0 0 6px; font-size:15px; font-weight:bold;">', escHtml(label === "Website Health" ? websiteStatusLabel(data.website.status) : businessStatusLabel(overallScore, overallMax)), '</p>',
      '<p style="color:', muted, '; margin:0; font-size:12px; line-height:1.4;">', escHtml(explanation), '</p>',
      '</td>',
    );
  }

  function progressRow(name: string, filled: number, total: number, showCount?: boolean): string {
    const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
    const barColor = pct >= 90 ? green : pct >= 50 ? amber : red;
    const display = showCount ? filled + "/" + total : pct + "%";
    return h(
      '<tr>',
      '<td style="padding:6px 0; font-size:13px; color:', primary, '; font-weight:bold; width:140px;">', escHtml(name), '</td>',
      '<td style="padding:6px 0;">',
      '<div style="background:', accent, '; border-radius:8px; height:12px; overflow:hidden; width:200px;">',
      '<div style="background:', barColor, '; width:', pct, '%; height:12px; border-radius:8px;"></div>',
      '</div></td>',
      '<td style="padding:6px 0 6px 10px; font-size:12px; color:', muted, ';">', display, '</td>',
      '</tr>',
    );
  }

  function statCell(label: string, value: number | string | null, widthPct: number, mutedColor: string, primaryColor: string, accentColor: string, bg: string): string {
    const display = value != null ? escHtml(value) : "Unavailable";
    return h(
      '<td style="width:', widthPct, '%; padding:4px; vertical-align:top; background:', bg, '; border:1px solid ', accentColor, '; border-radius:6px; text-align:center;">',
      '<p style="color:', mutedColor, '; margin:4px 6px 2px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; line-height:1.3;">', escHtml(label), '</p>',
      '<p style="color:', primaryColor, '; margin:2px 6px 6px; font-size:18px; font-weight:bold; word-break:break-all;">', display, '</p>',
      '</td>',
    );
  }

  // ── Assemble document ──────────────────────────────────────────

  const parts: string[] = [];

  parts.push('<!DOCTYPE html>');
  parts.push('<html><head><meta charset="utf-8"></head><body style="margin:0; padding:0; background:#f4f2ee; font-family:\'Segoe UI\',Arial,Helvetica,sans-serif;">');
  parts.push('<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 10px;">');
  parts.push('<table width="600" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:8px; overflow:hidden;">');

  // ── Header ─────────────────────────────────────────────────────

  parts.push(
    '<tr><td style="background:', primary, '; padding:28px 30px 24px; text-align:center;">',
    '<h1 style="color:#fff; margin:0; font-size:22px;">', escHtml(header), ' Health Report</h1>',
    '<p style="color:', accent, '; margin:6px 0 0; font-size:15px;">Weekly Business Health Report</p>',
    '<p style="color:#c4a99a; margin:4px 0 0; font-size:12px;">', escHtml(dateStr), '</p>',
    '</td></tr>',
  );

  // ── Section 1: Overall Health ─────────────────────────────────

  parts.push(
    '<tr><td style="padding:28px 30px 8px;"><h2 style="color:', primary, '; margin:0; font-size:18px;">Overall Health</h2></td></tr>',
    '<tr><td style="padding:0 30px 20px;">',
    '<table width="100%" cellpadding="0" cellspacing="0"><tr>',
    cardCell(ws.score, ws.maxScore, "Website Health", wsColor, healthExplanation(ws.status), true),
    cardCell(overallScore, overallMax, "Business Health", bsColor, businessExplanation(overallScore, overallMax), true),
    '</tr></table>',
    '</td></tr>',
  );

  // ── Section 2: Top Priorities ──────────────────────────────────

  parts.push(
    '<tr><td style="padding:0 30px;"><div style="border-top:1px solid ', accent, '; margin:0;"></div></td></tr>',
    '<tr><td style="padding:20px 30px 8px;"><h2 style="color:', primary, '; margin:0; font-size:18px;">Top Priorities</h2></td></tr>',
    '<tr><td style="padding:0 30px 20px;">',
  );

  if (priorities.length === 0) {
    parts.push(
      '<p style="color:', muted, '; font-size:14px; margin:0;">No issues found \u2014 everything looks good!</p>',
    );
  } else {
    for (const pri of priorities) {
      parts.push(
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:', warmBg, '; border:1px solid ', accent, '; border-radius:6px; margin-bottom:10px;">',
        '<tr><td style="padding:14px 18px;">',
        '<table width="100%" cellpadding="0" cellspacing="0"><tr>',
        '<td width="32" style="font-size:20px; vertical-align:top; line-height:1;">', pri.icon, '</td>',
        '<td style="vertical-align:top;">',
        '<p style="color:', pri.color, '; margin:0; font-size:14px; font-weight:bold;">', escHtml(pri.label), '</p>',
        '<p style="color:', muted, '; margin:2px 0 0; font-size:13px;">', escHtml(pri.detail), '</p>',
        '</td>',
        '</tr></table>',
        '</td></tr></table>',
      );
    }
  }

  parts.push('</td></tr>');

  // ── Section 3: Business Snapshot ──────────────────────────────

  parts.push(
    '<tr><td style="padding:0 30px;"><div style="border-top:1px solid ', accent, '; margin:0;"></div></td></tr>',
    '<tr><td style="padding:20px 30px 8px;"><h2 style="color:', primary, '; margin:0; font-size:18px;">Business Snapshot</h2></td></tr>',
    '<tr><td style="padding:0 30px 20px;">',
    '<table width="100%" cellpadding="0" cellspacing="0">',
  );

  const snapshot: [string, number | string][] = [
    ["Total Products", totalProducts],
    ["Collections", collectionsCount],
    ["Avg Images / Product", totalAvgImages.toFixed(1)],
    ["Featured Products", fullMetrics?.homepageFeatured ?? "\u2014"],
    ["Homepage Featured", fullMetrics?.homepageFeatured ?? "\u2014"],
    ["Gallery Featured", fullMetrics?.galleryFeatured ?? "\u2014"],
  ];

  for (let i = 0; i < snapshot.length; i += 3) {
    parts.push('<tr>');
    for (let j = i; j < i + 3 && j < snapshot.length; j++) {
      const [label, value] = snapshot[j];
      const w = j === i + 2 ? ' style="width:33.33%;"' : ' style="width:33.33%;"';
      parts.push(
        '<td', w, '>',
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:', warmBg, '; border:1px solid ', accent, '; border-radius:6px;">',
        '<tr><td style="padding:12px; text-align:center;">',
        '<p style="color:', muted, '; margin:0; font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">', escHtml(label), '</p>',
        '<p style="color:', primary, '; margin:6px 0 0; font-size:22px; font-weight:bold;">', escHtml(value), '</p>',
        '</td></tr></table>',
        '</td>',
      );
    }
    parts.push('</tr>');
    parts.push('<tr><td colspan="3" style="height:8px;"></td></tr>');
  }

  parts.push('</table></td></tr>');

  // ── Section 4: Progress ──────────────────────────────────────

  const descFilled = totalProducts - totalMissingShortDescriptions;
  const imagesFilled = totalProducts - needingImages;

  parts.push(
    '<tr><td style="padding:0 30px;"><div style="border-top:1px solid ', accent, '; margin:0;"></div></td></tr>',
    '<tr><td style="padding:20px 30px 8px;"><h2 style="color:', primary, '; margin:0; font-size:18px;">Progress</h2></td></tr>',
    '<tr><td style="padding:0 30px 20px;">',
    '<table width="100%" cellpadding="0" cellspacing="0">',
    progressRow("Active Products", totalProducts - (totalMissingDescriptions + totalMissingShortDescriptions + totalMissingPrices), totalProducts, true),
    progressRow("Descriptions", descFilled, totalProducts),
    progressRow("Images (\u22652)", imagesFilled, totalProducts),
    '</table>',
    '</td></tr>',
  );

  // ── Section 5: Product Inventory ─────────────────────────────

  parts.push(
    '<tr><td style="padding:0 30px;"><div style="border-top:1px solid ', accent, '; margin:0;"></div></td></tr>',
    '<tr><td style="padding:20px 30px 8px;"><h2 style="color:', primary, '; margin:0; font-size:18px;">Product Inventory</h2></td></tr>',
    '<tr><td style="padding:0 30px 20px;">',
  );

  for (const areaKey of areaKeys) {
    const area = areas[areaKey];
    const areaLabel = areaLabels[areaKey] || areaKey;

    const areaAnalysis = readProductAnalysisByArea(areaKey);
    const areaNeedingAttention: ProductAnalysisRow[] = [];
    const areaComplete: ProductAnalysisRow[] = [];

    for (const pr of areaAnalysis) {
      const issues: string[] = [];
      if (pr.imageCount <= 1) issues.push("image");
      if (!pr.hasDescription) issues.push("description");
      if (!pr.hasShortDescription) issues.push("short description");
      if (!pr.hasPrice) issues.push("price");
      if (pr.hasValidFormId === false) issues.push("form");
      if (issues.length > 0) {
        areaNeedingAttention.push(pr);
      } else {
        areaComplete.push(pr);
      }
    }

    if (areaNeedingAttention.length > 0) {
      parts.push(
        '<p style="color:', amber, '; font-size:13px; font-weight:bold; margin:0 0 10px;">', escHtml(areaLabel), ' - Needs Attention</p>',
        '<table width="100%" cellpadding="0" cellspacing="0">',
      );
      for (let i = 0; i < areaNeedingAttention.length; i += 3) {
        parts.push('<tr>');
        for (let j = i; j < i + 3 && j < areaNeedingAttention.length; j++) {
          const pr = areaNeedingAttention[j];
          const cardIssues: string[] = [];
          if (pr.imageCount <= 1) cardIssues.push("More images needed");
          if (!pr.hasDescription) cardIssues.push("Description needed");
          if (!pr.hasShortDescription) cardIssues.push("Short description needed");
          if (!pr.hasPrice) cardIssues.push("Price needed");
          if (pr.hasValidFormId === false) cardIssues.push("Form needed");

          parts.push(
            '<td width="33.33%" style="padding:4px; vertical-align:top; background:', warmBg, '; border:1px solid ', accent, '; border-radius:6px;">',
            '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:10px;">',
            '<p style="margin:0 0 6px; color:', amber, '; font-size:13px;">&#9888; <strong style="color:', primary, ';">', escHtml(pr.name), '</strong></p>',
            '<p style="margin:0; color:', muted, '; font-size:11px; line-height:1.5;">',
            cardIssues.map((i) => "\u2022 " + i).join("<br>"),
            '</p>',
            '</td></tr></table>',
            '</td>',
          );
        }
        for (let e = areaNeedingAttention.length - i; e < 3; e++) {
          parts.push('<td width="33.33%" style="padding:4px;"></td>');
        }
        parts.push('</tr>');
        parts.push('<tr><td colspan="3" style="height:4px;"></td></tr>');
      }
      parts.push('</table>');
    }

    if (areaComplete.length > 0) {
      parts.push(
        '<p style="color:', green, '; font-size:13px; font-weight:bold; margin:16px 0 10px;">', escHtml(areaLabel), ' - Complete</p>',
        '<table width="100%" cellpadding="0" cellspacing="0">',
      );
      for (let i = 0; i < areaComplete.length; i += 3) {
        parts.push('<tr>');
        for (let j = i; j < i + 3 && j < areaComplete.length; j++) {
          const pr = areaComplete[j];
          parts.push(
            '<td width="33.33%" style="padding:4px; vertical-align:top; background:', warmBg, '; border:1px solid ', accent, '; border-radius:6px;">',
            '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:10px;">',
            '<p style="margin:0; color:', green, '; font-size:13px;">&#10003; <strong style="color:', primary, ';">', escHtml(pr.name), '</strong></p>',
            '</td></tr></table>',
            '</td>',
          );
        }
        for (let e = areaComplete.length - i; e < 3; e++) {
          parts.push('<td width="33.33%" style="padding:4px;"></td>');
        }
        parts.push('</tr>');
        parts.push('<tr><td colspan="3" style="height:4px;"></td></tr>');
      }
      parts.push('</table>');
    }
  }

  parts.push('</td></tr>');

  // ── Section 6: Visibility ─────────────────────────────────────

  if (data.visibility) {
    const v = data.visibility;
    parts.push(
      '<tr><td style="padding:0 30px;"><div style="border-top:1px solid ', accent, '; margin:0;"></div></td></tr>',
      '<tr><td style="padding:20px 30px 8px;"><h2 style="color:', primary, '; margin:0; font-size:18px;">Visibility</h2></td></tr>',
      '<tr><td style="padding:0 30px 20px;">',
      '<table width="100%" cellpadding="0" cellspacing="0"><tr>',
      statCell("Impressions", v.impressions, 25, muted, primary, accent, warmBg),
      statCell("Search Clicks", v.clicks, 25, muted, primary, accent, warmBg),
      statCell("Avg Position", v.averagePosition, 25, muted, primary, accent, warmBg),
      statCell("Indexed Pages", v.indexedPages, 25, muted, primary, accent, warmBg),
      '</tr></table>',
      '</td></tr>',
    );
  }

  // ── Section 7: Visitors ───────────────────────────────────────

  if (data.visitors) {
    const v = data.visitors;
    const eng = v.averageEngagementTime != null ? Math.round(v.averageEngagementTime) + "s" : null;
    const topPageDisplay = v.topPage != null ? escHtml(v.topPage) : "Unavailable";
    parts.push(
      '<tr><td style="padding:0 30px;"><div style="border-top:1px solid ', accent, '; margin:0;"></div></td></tr>',
      '<tr><td style="padding:20px 30px 8px;"><h2 style="color:', primary, '; margin:0; font-size:18px;">Visitors</h2></td></tr>',
      '<tr><td style="padding:0 30px 20px;">',
      '<table width="100%" cellpadding="0" cellspacing="0"><tr>',
      statCell("Users", v.users, 33, muted, primary, accent, warmBg),
      statCell("Page Views", v.pageViews, 33, muted, primary, accent, warmBg),
      statCell("Avg Engagement", eng, 34, muted, primary, accent, warmBg),
      '</tr></table>',
      '<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;"><tr>',
      '<td style="padding:4px; vertical-align:top; background:', warmBg, '; border:1px solid ', accent, '; border-radius:6px; text-align:center;">',
      '<p style="color:', muted, '; margin:4px 6px 2px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; line-height:1.3;">Top Page</p>',
      '<p style="color:', primary, '; margin:2px 6px 6px; font-size:18px; font-weight:bold; word-break:break-all;">', topPageDisplay, '</p>',
      '</td>',
      '</tr></table>',
      '</td></tr>',
    );
  }

  // ── Footer ──────────────────────────────────────────────────

  const url = dashboardUrl || "https://haplo66.github.io/ripple-bakes-makes/doctor";

  parts.push(
    '<tr><td style="padding:0 30px;"><div style="border-top:1px solid ', accent, '; margin:0;"></div></td></tr>',
    '<tr><td style="padding:20px 30px 28px; text-align:center;">',
    '<p style="color:', muted, '; margin:0 0 8px; font-size:13px;">',
    '<a href="', escHtml(url), '" style="color:', primary, '; text-decoration:underline;">View full dashboard</a>',
    '</p>',
    '<p style="color:#c4a99a; margin:0; font-size:11px;">Generated automatically by RIPPLE Doctor</p>',
    '</td></tr>',
  );

  // ── Close ────────────────────────────────────────────────────

  parts.push('</table></td></tr></table></body></html>');

  return parts.join("");
}

// ─── Backward-compatible alias ─────────────────────────────────

function buildBody(data: OwnerReportData, businessName: string, dashboardUrl: string): string {
  return buildPlainTextBody(data, businessName, dashboardUrl);
}

// ─── Delivery ──────────────────────────────────────────────────

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
  const subject = buildSubject(businessName, data.website.status, overallStatus);
  const body = buildBody(data, businessName, dashboardUrl);
  const htmlBody = buildHtmlBody(data, businessName, dashboardUrl);

  const response = await postToAppsScript({
    doctor: { recipients, subject, body, htmlBody },
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

  if (!config) {
    return;
  }

  try {
    await sendEmail(data, config);
    console.log("  \u2713 Email sent to " + config.reportEmails.join(", "));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("  \u2717 Email delivery failed: " + msg);
  }
}

export { emailReport };
