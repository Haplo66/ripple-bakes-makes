import type { DoctorReport } from "../types";
import * as fs from "node:fs";
import * as path from "node:path";

function jsonReport(report: DoctorReport): void {
  const reportsDir = path.resolve("scripts/doctor/reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  const filePath = path.join(reportsDir, "doctor-report.json");
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2), "utf-8");
  console.log("JSON report written to " + filePath);
}

export { jsonReport };