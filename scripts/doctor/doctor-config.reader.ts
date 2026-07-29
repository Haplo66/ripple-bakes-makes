import { google } from "googleapis";

const DOCTOR_CONFIG_TAB = "Doctor Config";

type DoctorConfig = {
  doctorEnabled: boolean;
  reportEmails: string[];
  reportFrequency: string;
  dashboardUrl: string;
  businessName: string;
};

function hasSheetsCredentials(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
    process.env.ORDERS_GOOGLE_SHEETS_ID
  );
}

function parseKeyValueRows(rows: unknown[][]): Record<string, string> {
  const config: Record<string, string> = {};
  for (const row of rows) {
    if (row.length < 2) continue;
    const key = String(row[0] ?? "").trim();
    const value = String(row[1] ?? "").trim();
    if (key && value) {
      config[key] = value;
    }
  }
  return config;
}

async function readDoctorConfig(): Promise<DoctorConfig | null> {
  if (!hasSheetsCredentials()) {
    return null;
  }

  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.ORDERS_GOOGLE_SHEETS_ID;
    const range = `'${DOCTOR_CONFIG_TAB}'!A:B`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) return null;

    const raw = parseKeyValueRows(rows);

    const emails = (raw["Report Emails"] || "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    return {
      doctorEnabled: raw["Doctor Enabled"]?.toLowerCase() === "yes",
      reportEmails: emails,
      reportFrequency: raw["Report Frequency"] || "",
      dashboardUrl: raw["Dashboard URL"] || "",
      businessName: raw["Business Name"] || "",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log("  \u26A0 Doctor Config sheet not found or unreadable: " + message);
    return null;
  }
}

export type { DoctorConfig };
export { readDoctorConfig };
