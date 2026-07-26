import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

export async function authenticateDrive() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!clientEmail) {
    throw new Error(
      'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable. ' +
      'Set it to the service account email address.',
    );
  }

  if (!privateKey) {
    throw new Error(
      'Missing GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY environment variable. ' +
      'Set it to the service account private key.',
    );
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });

  const drive = google.drive({ version: 'v3', auth });

  return drive;
}
