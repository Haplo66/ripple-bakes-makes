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
  const p = data.business.products;
  const m = data.business;
  const ws = data.website;
  const header = businessName || "RIPPLE";

  const lines: string[] = [];

  lines.push(header + " Health Report");
  lines.push("Generated: " + formatDate(data.generated));
  lines.push("");
  lines.push("Website Health: " + ws.score + "/" + ws.maxScore + " " + websiteStatusLabel(ws.status));
  lines.push("Business Health: " + m.score + "/" + m.maxScore + " " + businessStatusLabel(m.score, m.maxScore));
  lines.push("");

  if (p.missingDescriptions > 0) lines.push("Product Descriptions: " + p.missingDescriptions + " missing");
  if (p.missingShortDescriptions > 0) lines.push("Short Descriptions: " + p.missingShortDescriptions + " missing");
  const needingImages = p.productsWithOneImage + p.productsWithNoImages;
  if (needingImages > 0) lines.push("Product Images: " + needingImages + " need attention");

  lines.push("");
  const url = dashboardUrl || "https://haplo66.github.io/ripple-bakes-makes/doctor";
  lines.push("Dashboard: " + url);

  return lines.join("\n");
}

// ─── HTML body ───────────────────────────────────────────────────

function buildHtmlBody(data: OwnerReportData, businessName: string, dashboardUrl: string): string {
  const p = data.business.products;
  const m = data.business;
  const ws = data.website;
  const header = businessName || "RIPPLE";

  const needingImages = p.productsWithOneImage + p.productsWithNoImages;
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

  const bsLabel = businessStatusLabel(m.score, m.maxScore);
  let bsColor = red;
  const bsPct = m.score / m.maxScore;
  if (bsPct >= 0.9) bsColor = green;
  else if (bsPct >= 0.75) bsColor = "#6b8e5a";
  else if (bsPct >= 0.5) bsColor = amber;

  // ── Priority cards ──────────────────────────────────────────────

  const priorities: { icon: string; label: string; detail: string; color: string }[] = [];

  if (p.missingDescriptions > 0) {
    priorities.push({
      icon: "&#128221;",
      label: "Product Descriptions",
      detail: p.missingDescriptions + " products need descriptions.",
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

  if (p.missingShortDescriptions > 0) {
    priorities.push({
      icon: "&#128196;",
      label: "Short Descriptions",
      detail: p.missingShortDescriptions + " products missing short descriptions.",
      color: amber,
    });
  }

  if (p.missingPrices > 0) {
    priorities.push({
      icon: "&#128176;",
      label: "Product Pricing",
      detail: p.missingPrices + " products missing price.",
      color: red,
    });
  }

  if (data.business.forms.missing > 0) {
    priorities.push({
      icon: "&#128203;",
      label: "Order Forms",
      detail: data.business.forms.missing + " products missing form reference.",
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

  const h = (...parts: string[]) => parts.join("");

  function card(score: number, max: number, label: string, color: string, explanation: string): string {
    return h(
      '<table width="100%" cellpadding="0" cellspacing="0" style="background:', warmBg, '; border:1px solid ', accent, '; border-radius:8px;">',
      '<tr><td style="padding:20px; text-align:center;">',
      '<p style="color:', muted, '; margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:1px;">', escHtml(label), '</p>',
      '<p style="font-size:32px; font-weight:bold; color:', primary, '; margin:8px 0 4px;">', escHtml(score), '/', escHtml(max), '</p>',
      '<p style="color:', color, '; margin:0 0 6px; font-size:15px; font-weight:bold;">', escHtml(label === "Website Health" ? websiteStatusLabel(data.website.status) : businessStatusLabel(m.score, m.maxScore)), '</p>',
      '<p style="color:', muted, '; margin:0; font-size:12px; line-height:1.4;">', escHtml(explanation), '</p>',
      '</td></tr></table>',
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
    '<td width="50%" style="vertical-align:top; padding-right:8px;">',
    card(ws.score, ws.maxScore, "Website Health", wsColor, healthExplanation(ws.status)),
    '</td>',
    '<td width="50%" style="vertical-align:top; padding-left:8px;">',
    card(m.score, m.maxScore, "Business Health", bsColor, businessExplanation(m.score, m.maxScore)),
    '</td>',
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
    ["Total Products", p.total],
    ["Collections", collectionsCount],
    ["Avg Images / Product", data.business.images.averagePerProduct.toFixed(1)],
    ["Featured Products", p.featured],
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

  const descFilled = p.total - p.missingShortDescriptions;
  const imagesFilled = p.total - needingImages;

  parts.push(
    '<tr><td style="padding:0 30px;"><div style="border-top:1px solid ', accent, '; margin:0;"></div></td></tr>',
    '<tr><td style="padding:20px 30px 8px;"><h2 style="color:', primary, '; margin:0; font-size:18px;">Progress</h2></td></tr>',
    '<tr><td style="padding:0 30px 20px;">',
    '<table width="100%" cellpadding="0" cellspacing="0">',
    progressRow("Active Products", p.active, p.total, true),
    progressRow("Descriptions", descFilled, p.total),
    progressRow("Images (\u22652)", imagesFilled, p.total),
    '</table>',
    '</td></tr>',
  );

  // ── Section 5: Product Inventory ─────────────────────────────

  parts.push(
    '<tr><td style="padding:0 30px;"><div style="border-top:1px solid ', accent, '; margin:0;"></div></td></tr>',
    '<tr><td style="padding:20px 30px 8px;"><h2 style="color:', primary, '; margin:0; font-size:18px;">Product Inventory</h2></td></tr>',
    '<tr><td style="padding:0 30px 20px;">',
  );

  if (needingAttention.length > 0) {
    parts.push(
      '<p style="color:', amber, '; font-size:13px; font-weight:bold; margin:0 0 10px;">Needs Attention</p>',
      '<table width="100%" cellpadding="0" cellspacing="0">',
    );
    for (let i = 0; i < needingAttention.length; i += 3) {
      parts.push('<tr>');
      for (let j = i; j < i + 3 && j < needingAttention.length; j++) {
        const pr = needingAttention[j];
        const cardIssues: string[] = [];
        if (pr.imageCount <= 1) cardIssues.push("More images needed");
        if (!pr.hasDescription) cardIssues.push("Description needed");
        if (!pr.hasShortDescription) cardIssues.push("Short description needed");
        if (!pr.hasPrice) cardIssues.push("Price needed");
        if (pr.hasValidFormId === false) cardIssues.push("Form needed");

        parts.push(
          '<td width="33.33%" style="padding:4px; vertical-align:top;">',
          '<table width="100%" cellpadding="0" cellspacing="0" style="background:', warmBg, '; border:1px solid ', accent, '; border-radius:6px;">',
          '<tr><td style="padding:10px;">',
          '<p style="margin:0 0 6px; color:', amber, '; font-size:13px;">&#9888; <strong style="color:', primary, ';">', escHtml(pr.name), '</strong></p>',
          '<p style="margin:0; color:', muted, '; font-size:11px; line-height:1.5;">',
          cardIssues.map((i) => "\u2022 " + i).join("<br>"),
          '</p>',
          '</td></tr></table>',
          '</td>',
        );
      }
      for (let e = needingAttention.length - i; e < 3; e++) {
        parts.push('<td width="33.33%" style="padding:4px;"></td>');
      }
      parts.push('</tr>');
      parts.push('<tr><td colspan="3" style="height:4px;"></td></tr>');
    }
    parts.push('</table>');
  }

  if (complete.length > 0) {
    parts.push(
      '<p style="color:', green, '; font-size:13px; font-weight:bold; margin:16px 0 10px;">Complete</p>',
      '<table width="100%" cellpadding="0" cellspacing="0">',
    );
    for (let i = 0; i < complete.length; i += 3) {
      parts.push('<tr>');
      for (let j = i; j < i + 3 && j < complete.length; j++) {
        const pr = complete[j];
        parts.push(
          '<td width="33.33%" style="padding:4px; vertical-align:top;">',
          '<table width="100%" cellpadding="0" cellspacing="0" style="background:', warmBg, '; border:1px solid ', accent, '; border-radius:6px;">',
          '<tr><td style="padding:10px;">',
          '<p style="margin:0; color:', green, '; font-size:13px;">&#10003; <strong style="color:', primary, ';">', escHtml(pr.name), '</strong></p>',
          '</td></tr></table>',
          '</td>',
        );
      }
      for (let e = complete.length - i; e < 3; e++) {
        parts.push('<td width="33.33%" style="padding:4px;"></td>');
      }
      parts.push('</tr>');
      parts.push('<tr><td colspan="3" style="height:4px;"></td></tr>');
    }
    parts.push('</table>');
  }

  parts.push('</td></tr>');

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
  const subject = buildSubject(businessName, data.website.status, data.business.status);
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

  try {
    await sendEmail(data, config);
    console.log("  \u2713 Email sent to " + config.reportEmails.join(", "));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("  \u2717 Email delivery failed: " + msg);
  }
}

export { emailReport };
