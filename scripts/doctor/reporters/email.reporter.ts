import * as fs from "node:fs";
import * as path from "node:path";
import nodemailer from "nodemailer";
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

async function sendEmail(
  data: OwnerReportData,
  config: DoctorConfig,
): Promise<void> {
  const to = config.reportEmails.length > 0
    ? config.reportEmails.join(", ")
    : getEnv("DOCTOR_EMAIL_TO") || "";
  const from = getEnv("DOCTOR_EMAIL_FROM") || "";
  const host = getEnv("DOCTOR_SMTP_HOST") || "smtp.gmail.com";
  const port = parseInt(getEnv("DOCTOR_SMTP_PORT") || "587", 10);
  const user = getEnv("DOCTOR_SMTP_USER") || "";
  const pass = getEnv("DOCTOR_SMTP_SECRET") || "";

  if (!to || !from || !user || !pass) {
    console.log("  \u2139 Email delivery skipped - incomplete SMTP configuration");
    return;
  }

  const businessName = config.businessName || "RIPPLE";
  const dashboardUrl = config.dashboardUrl || "";
  const subject = buildSubject(businessName, data.website.status, data.business.status);
  const text = buildBody(data, businessName, dashboardUrl);

  const transporter = nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465,
    auth: { user: user, pass: pass },
  });

  await transporter.sendMail({
    from: from,
    to: to,
    subject: subject,
    text: text,
  });
}

async function emailReport(config: DoctorConfig | null): Promise<void> {
  const doctorEnabled = config ? config.doctorEnabled : getEnv("DOCTOR_EMAIL_ENABLED") === "true";

  if (!doctorEnabled) {
    console.log("  \u2139 Email delivery skipped - not configured (set Doctor Enabled = Yes in Doctor Config sheet)");
    return;
  }

  const reportEmails = config ? config.reportEmails : [];
  const hasReportEmails = reportEmails.length > 0 || !!getEnv("DOCTOR_EMAIL_TO");

  if (!hasReportEmails) {
    console.log("  \u2139 Email delivery skipped - no recipient emails configured (set Report Emails in Doctor Config sheet or DOCTOR_EMAIL_TO env)");
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
    await sendEmail(data, config || { doctorEnabled: true, reportEmails: [], reportFrequency: "", dashboardUrl: "", businessName: "" });
    const recipient = config && config.reportEmails.length > 0
      ? config.reportEmails.join(", ")
      : getEnv("DOCTOR_EMAIL_TO");
    console.log("  \u2713 Email sent to " + recipient);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("  \u2717 Email delivery failed: " + msg);
  }
}

export { emailReport };
