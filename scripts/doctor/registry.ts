/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import type { DoctorCheck } from "./types.ts";

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