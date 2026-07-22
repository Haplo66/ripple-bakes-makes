import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

export async function authenticateSheets() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

  if (!clientEmail) {
    throw new Error(
      'Missing GOOGLE_SHEETS_CLIENT_EMAIL environment variable. ' +
      'Set it to the service account email address.',
    );
  }

  if (!privateKey) {
    throw new Error(
      'Missing GOOGLE_SHEETS_PRIVATE_KEY environment variable. ' +
      'Set it to the service account private key.',
    );
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: 'v4', auth });

  return sheets;
}
