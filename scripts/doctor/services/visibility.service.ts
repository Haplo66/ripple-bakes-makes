/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved.
 *
 */

import { google } from "googleapis";

export type VisibilityData = {
  impressions: number | null;
  clicks: number | null;
  averagePosition: number | null;
  indexedPages: number | null;
};

function dbg(label: string, ...args: unknown[]): void {
  console.log("  [DEBUG vis] " + label, ...args);
}

function hasCredentials(): boolean {
  const hasEmail = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const hasKey = !!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const hasUrl = !!process.env.PUBLIC_GSC_SITE_URL;
  dbg("hasCredentials — email:" + hasEmail + " key:" + hasKey + " url:" + hasUrl);
  if (!hasEmail) dbg("  GOOGLE_SERVICE_ACCOUNT_EMAIL is missing or empty");
  if (!hasKey) dbg("  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is missing or empty");
  if (!hasUrl) dbg("  PUBLIC_GSC_SITE_URL is missing or empty");
  return hasEmail && hasKey && hasUrl;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function fetchVisibility(): Promise<VisibilityData> {
  if (!hasCredentials()) {
    dbg("Credentials check failed — returning nulls");
    return { impressions: null, clicks: null, averagePosition: null, indexedPages: null };
  }

  try {
    dbg("Creating JWT auth with email:", process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });

    const webmasters = google.webmasters({ version: "v3", auth });
    const siteUrl = process.env.PUBLIC_GSC_SITE_URL!;
    dbg("siteUrl:", siteUrl);

    const endDate = formatDate(new Date());
    const startDate = formatDate(new Date(Date.now() - 7 * 86400000));
    dbg("dateRange:", startDate, "→", endDate);

    dbg("Calling searchanalytics.query...");
    const searchResponse = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: [],
      },
    });
    dbg("searchanalytics.query response status:", searchResponse.status);
    dbg("searchanalytics.query data keys:", Object.keys(searchResponse.data));
    dbg("searchanalytics.query rows present:", Array.isArray(searchResponse.data.rows));
    dbg("searchanalytics.query row count:", searchResponse.data.rows?.length ?? 0);

    const rows = searchResponse.data.rows || [];
    if (rows.length > 0) {
      dbg("First row keys:", Object.keys(rows[0]));
      dbg("First row values:", JSON.stringify(rows[0]));
    }

    const clicks = rows.length > 0 ? (rows[0].clicks ?? null) : null;
    const impressions = rows.length > 0 ? (rows[0].impressions ?? null) : null;
    const averagePosition = rows.length > 0 ? (rows[0].position ?? null) : null;
    dbg("Extracted — impressions:", impressions, "clicks:", clicks, "position:", averagePosition);

    let indexedPages: number | null = null;
    try {
      dbg("Calling sitemaps.list...");
      const sitemapsResponse = await webmasters.sitemaps.list({ siteUrl });
      dbg("sitemaps.list response status:", sitemapsResponse.status);
      dbg("sitemaps list present:", Array.isArray(sitemapsResponse.data.sitemap));
      dbg("sitemaps count:", sitemapsResponse.data.sitemap?.length ?? 0);
      const sitemaps = sitemapsResponse.data.sitemap || [];
      let total = 0;
      for (const s of sitemaps) {
        if (s.contents) {
          for (const c of s.contents) {
            const val = Number(c.indexed ?? 0);
            dbg("  sitemap content indexed:", val, "type:", c.type);
            total += val;
          }
        }
      }
      indexedPages = total > 0 ? total : null;
      dbg("total indexed pages:", total, "→", indexedPages);
    } catch (sitemapErr) {
      const msg = sitemapErr instanceof Error ? sitemapErr.message : String(sitemapErr);
      dbg("sitemaps.list failed:", msg);
      // sitemaps not configured — skip indexed pages
    }

    dbg("Returning visibility data:", JSON.stringify({ impressions, clicks, averagePosition, indexedPages }));
    return { impressions, clicks, averagePosition, indexedPages };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    dbg("API call threw:", msg);
    if (err instanceof Error && err.stack) {
      dbg("Stack:", err.stack.split("\n").slice(0, 4).join("\n"));
    }
    console.log("  \u26A0 Visibility data unavailable: " + msg);
    return { impressions: null, clicks: null, averagePosition: null, indexedPages: null };
  }
}

export { fetchVisibility };
