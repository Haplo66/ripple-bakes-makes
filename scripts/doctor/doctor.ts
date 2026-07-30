/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import type { DoctorCheck, DoctorResult, DoctorReport } from "./types.ts";
import { getRegisteredChecks, registerChecks } from "./registry.ts";
import { buildHealthScore, buildSummary } from "./scoring.ts";
import { buildBusinessHealth } from "./business.ts";
import { consoleReport } from "./reporters/console.reporter.ts";
import { markdownReport } from "./reporters/markdown.reporter.ts";
import { jsonReport } from "./reporters/json.reporter.ts";
import { ownerReport } from "./reporters/owner.reporter.ts";
import { emailReport } from "./reporters/email.reporter.ts";
import { readDoctorConfig } from "./doctor-config.reader.ts";
import exampleCheck from "./checks/example.check.ts";
import configChecks from "./checks/config.check.ts";
import dataChecks from "./checks/data.check.ts";
import assetChecks from "./checks/asset.check.ts";
import pipelineChecks from "./checks/pipeline.check.ts";
import { fetchVisibility } from "./services/visibility.service.ts";
import { fetchVisitors } from "./services/visitors.service.ts";

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

async function main(): Promise<void> {
  registerChecks([exampleCheck, ...configChecks, ...dataChecks, ...assetChecks, ...pipelineChecks]);

  const checks = getRegisteredChecks();
  const results = await runChecks(checks);
  const summary = buildSummary(results);
  const websiteHealth = buildHealthScore(results);
  const businessHealth = buildBusinessHealth();
  const visibility = await fetchVisibility();
  const visitors = await fetchVisitors();

  const report: DoctorReport = {
    timestamp: new Date().toISOString(),
    version: getVersion(),
    commit: getCommit(),
    websiteHealth,
    businessHealth: businessHealth as unknown as Record<string, unknown>,
    visibility,
    visitors,
    summary,
    results,
  };

  consoleReport(report);
  markdownReport(report);
  jsonReport(report);

  console.log("\n\u2713 Owner report generated");
  ownerReport(report);

  const doctorConfig = await readDoctorConfig();
  await emailReport(doctorConfig);

  if (summary.fail > 0) {
    process.exitCode = 1;
  }
}

await main();