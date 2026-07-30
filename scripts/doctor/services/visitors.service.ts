/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { google } from "googleapis";

export type VisitorsData = {
  users: number | null;
  pageViews: number | null;
  averageEngagementTime: number | null;
  topPage: string | null;
};

function dbg(label: string, ...args: unknown[]): void {
  console.log("  [DEBUG visi] " + label, ...args);
}

function hasCredentials(): boolean {
  const hasEmail = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const hasKey = !!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const hasProp = !!process.env.PUBLIC_GA4_PROPERTY_ID;
  dbg("hasCredentials — email:" + hasEmail + " key:" + hasKey + " prop:" + hasProp);
  if (!hasEmail) dbg("  GOOGLE_SERVICE_ACCOUNT_EMAIL is missing or empty");
  if (!hasKey) dbg("  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is missing or empty");
  if (!hasProp) dbg("  PUBLIC_GA4_PROPERTY_ID is missing or empty");
  return hasEmail && hasKey && hasProp;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function fetchVisitors(): Promise<VisitorsData> {
  if (!hasCredentials()) {
    dbg("Credentials check failed — returning nulls");
    return { users: null, pageViews: null, averageEngagementTime: null, topPage: null };
  }

  try {
    dbg("Creating JWT auth with email:", process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });

    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const propertyId = process.env.PUBLIC_GA4_PROPERTY_ID!;
    const property = "properties/" + propertyId;
    dbg("GA4 property:", property);

    const endDate = formatDate(new Date());
    const startDate = formatDate(new Date(Date.now() - 7 * 86400000));
    dbg("dateRange:", startDate, "→", endDate);

    dbg("Calling properties.runReport (main)...");
    const mainResponse = await analyticsData.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: "activeUsers" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
        ],
      },
    });
    dbg("main runReport response status:", (mainResponse as unknown as { status?: number }).status);
    dbg("main runReport data keys:", Object.keys(mainResponse.data));
    dbg("main runReport rows present:", Array.isArray(mainResponse.data.rows));
    dbg("main runReport row count:", mainResponse.data.rows?.length ?? 0);

    if (mainResponse.data.rows && mainResponse.data.rows.length > 0) {
      dbg("First row keys:", Object.keys(mainResponse.data.rows[0]));
      dbg("First row metricValues:", JSON.stringify(mainResponse.data.rows[0].metricValues));
    }

    const mainRow = mainResponse.data.rows?.[0];
    const users = mainRow?.metricValues?.[0]?.value ?? null;
    const pageViews = mainRow?.metricValues?.[1]?.value ?? null;
    const avgEngagement = mainRow?.metricValues?.[2]?.value ?? null;
    dbg("Extracted — users:", users, "pageViews:", pageViews, "avgEngagement:", avgEngagement);

    let topPage: string | null = null;
    try {
      dbg("Calling properties.runReport (top page)...");
      const topPageResponse = await analyticsData.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: "1",
        },
      } as never);
      const responseData = (topPageResponse as unknown as { data: { rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[] } }).data;
      dbg("topPage runReport rows present:", Array.isArray(responseData.rows));
      dbg("topPage runReport row count:", responseData.rows?.length ?? 0);
      if (responseData.rows && responseData.rows.length > 0) {
        dbg("topPage first row dimensionValues:", JSON.stringify(responseData.rows[0].dimensionValues));
        dbg("topPage first row metricValues:", JSON.stringify(responseData.rows[0].metricValues));
      }
      const rows = responseData.rows;
      topPage = rows?.[0]?.dimensionValues?.[0]?.value ?? null;
      dbg("topPage result:", topPage);
    } catch (topPageErr) {
      const msg = topPageErr instanceof Error ? topPageErr.message : String(topPageErr);
      dbg("topPage runReport failed:", msg);
      // top page not available
    }

    const result = {
      users: users != null ? Number(users) : null,
      pageViews: pageViews != null ? Number(pageViews) : null,
      averageEngagementTime: avgEngagement != null ? Number(avgEngagement) : null,
      topPage,
    };
    dbg("Returning visitors data:", JSON.stringify(result));
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    dbg("API call threw:", msg);
    if (err instanceof Error && err.stack) {
      dbg("Stack:", err.stack.split("\n").slice(0, 4).join("\n"));
    }
    console.log("  \u26A0 Visitors data unavailable: " + msg);
    return { users: null, pageViews: null, averageEngagementTime: null, topPage: null };
  }
}

export { fetchVisitors };
