import type { DoctorResult, DoctorReport } from "../types";

function consoleReport(report: DoctorReport): void {
  console.log("\nRIPPLE Doctor\n");

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

  console.log("\nSummary:");
  console.log("  PASS: " + report.summary.pass);
  console.log("  WARN: " + report.summary.warn);
  console.log("  FAIL: " + report.summary.fail);
  console.log("  INFO: " + report.summary.info);
}

export { consoleReport };