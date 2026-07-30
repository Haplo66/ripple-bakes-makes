/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved.
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
