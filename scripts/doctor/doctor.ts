import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import type { DoctorCheck, DoctorResult, DoctorSummary, DoctorReport } from "./types";
import { getRegisteredChecks, registerChecks } from "./registry";
import { consoleReport } from "./reporters/console.reporter";
import { markdownReport } from "./reporters/markdown.reporter";
import { jsonReport } from "./reporters/json.reporter";
import exampleCheck from "./checks/example.check";

function getVersion(): string {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf-8"));
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function getCommit(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" as const }).trim();
  } catch {
    return "unknown";
  }
}

async function runChecks(checks: DoctorCheck[]): Promise<DoctorResult[]> {
  const results: DoctorResult[] = [];
  for (const check of checks) {
    try {
      const result = await Promise.resolve(check.run());
      results.push(result);
    } catch (error) {
      results.push({
        id: check.id,
        category: check.category,
        status: "FAIL",
        summary: "Check crashed with an error",
        details: [error instanceof Error ? error.message : String(error)],
        recommendation: "Check the check implementation for bugs",
      });
    }
  }
  return results;
}

function buildSummary(results: DoctorResult[]): DoctorSummary {
  const summary: DoctorSummary = { total: results.length, pass: 0, warn: 0, fail: 0, info: 0 };
  for (const r of results) {
    if (r.status === "PASS") summary.pass++;
    else if (r.status === "WARN") summary.warn++;
    else if (r.status === "FAIL") summary.fail++;
    else if (r.status === "INFO") summary.info++;
  }
  return summary;
}

async function main(): Promise<void> {
  registerChecks([exampleCheck]);

  const checks = getRegisteredChecks();
  const results = await runChecks(checks);
  const summary = buildSummary(results);

  const report: DoctorReport = {
    timestamp: new Date().toISOString(),
    version: getVersion(),
    commit: getCommit(),
    summary,
    results,
  };

  consoleReport(report);
  markdownReport(report);
  jsonReport(report);

  if (summary.fail > 0) {
    process.exitCode = 1;
  }
}

await main();