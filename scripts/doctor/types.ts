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

type DoctorReport = {
  timestamp: string;
  version: string;
  commit: string;
  summary: DoctorSummary;
  results: DoctorResult[];
};

export type { DoctorStatus, DoctorResult, DoctorCheck, DoctorSummary, DoctorReport };