/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved. Proprietary and confidential. Unauthorized copying of this file is strictly prohibited.
 *
 *
 */

export type SubmissionResult =
  | {
      success: true;
      providerName: string;
      message?: string;
      externalReferenceId?: string;
    }
  | {
      success: false;
      providerName: string;
      error?: string;
    };
