import * as fs from "node:fs";
import * as path from "node:path";
import type { DoctorConfig } from "../doctor-config.reader.ts";

type OwnerReportData = {
  generated: string;
  website: { score: number; maxScore: number; status: string };
  business: { score: number; maxScore: number; status: string };
  healthTable: { check: string; result: string; status: string }[];
  recommendations: { priority: string; area: string; text: string }[];
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

function buildBody(data: OwnerReportData, businessName: string, dashboardUrl: string): string {
  const lines: string[] = [];

  lines.push((businessName || "RIPPLE") + " Health Report");
  lines.push("");
  lines.push("Generated: " + new Date(data.generated).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }));
  lines.push("");

  const ws = data.website;
  lines.push("Website Health:");
  lines.push("  " + ws.score + "/" + ws.maxScore + " " + ws.status);
  lines.push("");

  const bs = data.business;
  lines.push("Business Health:");
  lines.push("  " + bs.score + "/" + bs.maxScore + " " + bs.status);
  lines.push("");

  const needsAttention = data.healthTable.filter(
    (r) => r.status !== "Good",
  );
  if (needsAttention.length > 0) {
    lines.push("Items needing attention:");
    for (const row of needsAttention) {
      lines.push("  - " + row.check + ": " + row.result);
    }
    lines.push("");
  }

  const highRecs = data.recommendations.filter(
    (r) => r.priority === "HIGH",
  );
  if (highRecs.length > 0) {
    lines.push("High priority recommendations:");
    for (const r of highRecs) {
      lines.push("  - " + r.text);
    }
    lines.push("");
  }

  const url = dashboardUrl || "https://haplo66.github.io/ripple-bakes-makes/doctor";
  lines.push("Dashboard:");
  lines.push("  " + url);

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
