/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved.
 *
 */

type DoctorStatus = "PASS" | "WARN" | "FAIL" | "INFO";

type DoctorResult = {
  id: string;
  category: string;
  status: DoctorStatus;
  summary: string;
  details?: string[];
  recommendation?: string;
};

type DoctorCheck = {
  id: string;
  category: string;
  run: () => DoctorResult | Promise<DoctorResult>;
};

type DoctorSummary = {
  total: number;
  pass: number;
  warn: number;
  fail: number;
  info: number;
};

type DoctorHealthScore = {
  score: number;
  maxScore: number;
  status: "GOOD" | "ATTENTION" | "CRITICAL";
  recommendations: { id: string; text: string }[];
};

type DoctorReport = {
  timestamp: string;
  version: string;
  commit: string;
  websiteHealth: DoctorHealthScore;
  businessHealth: Record<string, unknown>;
  visibility?: {
    impressions: number | null;
    clicks: number | null;
    averagePosition: number | null;
    indexedPages: number | null;
  };
  visitors?: {
    users: number | null;
    pageViews: number | null;
    averageEngagementTime: number | null;
    topPage: string | null;
  };
  summary: DoctorSummary;
  results: DoctorResult[];
};

export type { DoctorStatus, DoctorResult, DoctorCheck, DoctorSummary, DoctorHealthScore, DoctorReport };