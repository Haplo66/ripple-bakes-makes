/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import type { DoctorResult, DoctorSummary } from "./types.ts";

type HealthStatus = "GOOD" | "ATTENTION" | "CRITICAL";

type DoctorHealthScore = {
  score: number;
  maxScore: number;
  status: HealthStatus;
  recommendations: { id: string; text: string }[];
};

const WARN_DEDUCTION = 5;
const FAIL_DEDUCTION = 15;
const MAX_SCORE = 100;

function calculateScore(results: DoctorResult[]): number {
  let score = MAX_SCORE;
  for (const r of results) {
    if (r.status === "WARN") score -= WARN_DEDUCTION;
    if (r.status === "FAIL") score -= FAIL_DEDUCTION;
  }
  return Math.max(0, score);
}

function getStatus(score: number): HealthStatus {
  if (score >= 90) return "GOOD";
  if (score >= 70) return "ATTENTION";
  return "CRITICAL";
}

function collectRecommendations(results: DoctorResult[]): { id: string; text: string }[] {
  const seen = new Set<string>();
  const recs: { id: string; text: string }[] = [];
  for (const r of results) {
    if (r.status !== "WARN" && r.status !== "FAIL") continue;
    if (!r.recommendation) continue;
    const key = r.recommendation.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recs.push({ id: r.id, text: r.recommendation });
  }
  return recs;
}

function buildHealthScore(results: DoctorResult[]): DoctorHealthScore {
  const score = calculateScore(results);
  const status = getStatus(score);
  const recommendations = collectRecommendations(results);
  return { score, maxScore: MAX_SCORE, status, recommendations };
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

export type { HealthStatus, DoctorHealthScore };
export { calculateScore, getStatus, collectRecommendations, buildHealthScore, buildSummary, WARN_DEDUCTION, FAIL_DEDUCTION, MAX_SCORE };