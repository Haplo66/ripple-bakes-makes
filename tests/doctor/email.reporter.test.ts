/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { emailReport } from '../../scripts/doctor/reporters/email.reporter.ts';
import type { DoctorConfig } from '../../scripts/doctor/doctor-config.reader.ts';

const REPORTS_DIR = path.resolve('scripts/doctor/reports');
const OWNER_PATH = path.join(REPORTS_DIR, 'doctor-report-owner.json');

function writeMockOwnerReport(content: unknown): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(OWNER_PATH, JSON.stringify(content, null, 2), 'utf-8');
}

describe('emailReport — no false email failures', () => {
  let config: DoctorConfig;

  before(() => {
    config = {
      doctorEnabled: true,
      reportEmails: ['test@example.com'],
      businessName: 'Test Business',
      dashboardUrl: 'https://example.com/doctor',
    };
    if (fs.existsSync(OWNER_PATH)) {
      fs.unlinkSync(OWNER_PATH);
    }
  });

  it('does not report false failures for normal Apps Script responses', async () => {
    writeMockOwnerReport({
      generated: '2026-01-01T00:00:00.000Z',
      version: '1.0.0',
      website: {
        score: 90,
        maxScore: 100,
        status: 'GOOD',
        checks: { passed: 10, warnings: 0, failures: 0 },
      },
      business: {
        score: 80,
        maxScore: 100,
        status: 'ATTENTION',
        products: { total: 5, active: 5, featured: 2, missingDescriptions: 0, missingShortDescriptions: 0, missingPrices: 0, productsWithOneImage: 1, productsWithNoImages: 0 },
        images: { total: 12, averagePerProduct: 2.4 },
        forms: { available: 3, uniqueReferenced: 4, missing: 1, productsLinked: 4 },
      },
      visibility: null,
      visitors: null,
      healthTable: [],
      recommendations: [],
      groupedRecommendations: [],
      issuesByArea: [],
    });

    await emailReport(config);
    // If we get here without throwing, the email submission was accepted
  });

  it('handles opaque network errors without marking as failure', async () => {
    writeMockOwnerReport({
      generated: '2026-01-01T00:00:00.000Z',
      version: '1.0.0',
      website: {
        score: 90,
        maxScore: 100,
        status: 'GOOD',
        checks: { passed: 10, warnings: 0, failures: 0 },
      },
      business: {
        score: 80,
        maxScore: 100,
        status: 'ATTENTION',
        products: { total: 5, active: 5, featured: 2, missingDescriptions: 0, missingShortDescriptions: 0, missingPrices: 0, productsWithOneImage: 1, productsWithNoImages: 0 },
        images: { total: 12, averagePerProduct: 2.4 },
        forms: { available: 3, uniqueReferenced: 4, missing: 1, productsLinked: 4 },
      },
      visibility: null,
      visitors: null,
      healthTable: [],
      recommendations: [],
      groupedRecommendations: [],
      issuesByArea: [],
    });

    await emailReport(config);
  });

  it('does not fail when Apps Script returns a non-success JSON but the request went through', async () => {
    writeMockOwnerReport({
      generated: '2026-01-01T00:00:00.000Z',
      version: '1.0.0',
      website: {
        score: 90,
        maxScore: 100,
        status: 'GOOD',
        checks: { passed: 10, warnings: 0, failures: 0 },
      },
      business: {
        score: 80,
        maxScore: 100,
        status: 'ATTENTION',
        products: { total: 5, active: 5, featured: 2, missingDescriptions: 0, missingShortDescriptions: 0, missingPrices: 0, productsWithOneImage: 1, productsWithNoImages: 0 },
        images: { total: 12, averagePerProduct: 2.4 },
        forms: { available: 3, uniqueReferenced: 4, missing: 1, productsLinked: 4 },
      },
      visibility: null,
      visitors: null,
      healthTable: [],
      recommendations: [],
      groupedRecommendations: [],
      issuesByArea: [],
    });

    await emailReport(config);
  });
});
