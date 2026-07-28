import type { DoctorReport } from "../types.ts";
import * as fs from "node:fs";
import * as path from "node:path";

function jsonReport(report: DoctorReport): void {
  const reportsDir = path.resolve("scripts/doctor/reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  const filePath = path.join(reportsDir, "doctor-report.json");
  const output = {
    timestamp: report.timestamp,
    version: report.version,
    commit: report.commit,
    healthScore: report.healthScore.score,
    healthStatus: report.healthScore.status,
    summary: {
      passed: report.summary.pass,
      warnings: report.summary.warn,
      failures: report.summary.fail,
      info: report.summary.info,
    },
    recommendations: report.healthScore.recommendations.map((r) => ({ id: r.id, text: r.text })),
    results: report.results,
  };
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2), "utf-8");
  console.log("JSON report written to " + filePath);
}

export { jsonReport };