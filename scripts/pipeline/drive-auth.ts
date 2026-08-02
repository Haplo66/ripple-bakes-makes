/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

import { google } from 'googleapis';

const READ_SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const WRITE_SCOPES = ['https://www.googleapis.com/auth/drive'];

export async function authenticateDrive(write = false) {
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
    scopes: write ? WRITE_SCOPES : READ_SCOPES,
  });

  const drive = google.drive({ version: 'v3', auth });

  return drive;
}
