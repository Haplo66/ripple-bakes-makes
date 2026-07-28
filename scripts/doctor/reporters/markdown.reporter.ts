import type { DoctorResult, DoctorReport } from "../types.ts";
import * as fs from "node:fs";
import * as path from "node:path";

function markdownReport(report: DoctorReport): void {
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
  lines.push("## Health Score");
  lines.push("");
  lines.push("Score: " + report.healthScore.score + "/" + report.healthScore.maxScore);
  lines.push("Status: " + report.healthScore.status);
  lines.push("");
  lines.push("## Summary");
  lines.push("| Status | Count |");
  lines.push("|--------|-------|");
  lines.push("| PASS   | " + report.summary.pass + " |");
  lines.push("| WARN   | " + report.summary.warn + " |");
  lines.push("| FAIL   | " + report.summary.fail + " |");
  lines.push("| INFO   | " + report.summary.info + " |");
  lines.push("");
  if (report.healthScore.recommendations.length > 0) {
    lines.push("## Recommendations");
    lines.push("");
    for (const rec of report.healthScore.recommendations) {
      lines.push("- [" + rec.id + "] " + rec.text);
    }
    lines.push("");
  }
  lines.push("## Results");
  lines.push("");

  for (const result of report.results) {
    lines.push("### " + result.id + ": " + result.summary);
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

  fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
  console.log("Markdown report written to " + filePath);
}

export { markdownReport };
