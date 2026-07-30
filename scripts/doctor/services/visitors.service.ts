import { google } from "googleapis";

export type VisitorsData = {
  users: number | null;
  pageViews: number | null;
  averageEngagementTime: number | null;
  topPage: string | null;
};

function hasCredentials(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
    process.env.PUBLIC_GA4_PROPERTY_ID
  );
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function fetchVisitors(): Promise<VisitorsData> {
  if (!hasCredentials()) {
    return { users: null, pageViews: null, averageEngagementTime: null, topPage: null };
  }

  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });

    const analyticsData = google.analyticsdata({ version: "v1beta", auth });
    const propertyId = process.env.PUBLIC_GA4_PROPERTY_ID!;
    const property = "properties/" + propertyId;

    const endDate = formatDate(new Date());
    const startDate = formatDate(new Date(Date.now() - 7 * 86400000));

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

    const mainRow = mainResponse.data.rows?.[0];
    const users = mainRow?.metricValues?.[0]?.value ?? null;
    const pageViews = mainRow?.metricValues?.[1]?.value ?? null;
    const avgEngagement = mainRow?.metricValues?.[2]?.value ?? null;

    let topPage: string | null = null;
    try {
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
      const rows = (topPageResponse as unknown as { data: { rows?: { dimensionValues?: { value?: string }[] }[] } }).data.rows;
      topPage = rows?.[0]?.dimensionValues?.[0]?.value ?? null;
    } catch {
      // top page not available
    }

    return {
      users: users != null ? Number(users) : null,
      pageViews: pageViews != null ? Number(pageViews) : null,
      averageEngagementTime: avgEngagement != null ? Number(avgEngagement) : null,
      topPage,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("  \u26A0 Visitors data unavailable: " + msg);
    return { users: null, pageViews: null, averageEngagementTime: null, topPage: null };
  }
}

export { fetchVisitors };
