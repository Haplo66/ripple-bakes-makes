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
