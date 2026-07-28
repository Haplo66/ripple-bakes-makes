import type { DoctorCheck } from "./types";

let checks: DoctorCheck[] = [];

function registerChecks(newChecks: DoctorCheck[]): void {
  checks = [...checks, ...newChecks];
}

function getRegisteredChecks(): DoctorCheck[] {
  return [...checks];
}

function clearChecks(): void {
  checks = [];
}

export { registerChecks, getRegisteredChecks, clearChecks };