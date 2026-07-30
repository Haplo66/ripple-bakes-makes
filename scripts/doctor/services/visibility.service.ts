import { google } from "googleapis";

export type VisibilityData = {
  impressions: number | null;
  clicks: number | null;
  averagePosition: number | null;
  indexedPages: number | null;
};

function hasCredentials(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
    process.env.PUBLIC_GSC_SITE_URL
  );
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function fetchVisibility(): Promise<VisibilityData> {
  if (!hasCredentials()) {
    return { impressions: null, clicks: null, averagePosition: null, indexedPages: null };
  }

  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });

    const webmasters = google.webmasters({ version: "v3", auth });
    const siteUrl = process.env.PUBLIC_GSC_SITE_URL!;

    const endDate = formatDate(new Date());
    const startDate = formatDate(new Date(Date.now() - 7 * 86400000));

    const searchResponse = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: [],
      },
    });

    const rows = searchResponse.data.rows || [];
    const clicks = rows.length > 0 ? (rows[0].clicks ?? null) : null;
    const impressions = rows.length > 0 ? (rows[0].impressions ?? null) : null;
    const averagePosition = rows.length > 0 ? (rows[0].position ?? null) : null;

    let indexedPages: number | null = null;
    try {
      const sitemapsResponse = await webmasters.sitemaps.list({ siteUrl });
      const sitemaps = sitemapsResponse.data.sitemap || [];
      let total = 0;
      for (const s of sitemaps) {
        if (s.contents) {
          for (const c of s.contents) {
            total += Number(c.indexed ?? 0);
          }
        }
      }
      indexedPages = total > 0 ? total : null;
    } catch {
      // sitemaps not configured — skip indexed pages
    }

    return { impressions, clicks, averagePosition, indexedPages };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("  \u26A0 Visibility data unavailable: " + msg);
    return { impressions: null, clicks: null, averagePosition: null, indexedPages: null };
  }
}

export { fetchVisibility };
