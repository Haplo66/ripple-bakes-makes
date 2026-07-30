/*
 * Copyright (c) 2026 Eyal Tal. All rights reserved.
 *
 */

import type { Order } from '../types/order';
import type { SubmissionResult } from '../types/submission';
import type { SubmissionProvider } from './submission/providers/submission-provider';
import { mockSubmissionProvider } from './submission/providers/mockSubmissionProvider';
import { appsScriptSubmissionProvider } from './submission/providers/appsScriptSubmissionProvider';

const selectProvider = (): SubmissionProvider => {
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env?.PUBLIC_SUBMISSION_ENDPOINT
  ) {
    return appsScriptSubmissionProvider;
  }

  return mockSubmissionProvider;
};

const configuredProvider = selectProvider();

/** Single integration point for the external order handler. */
export const submitOrder = (
  order: Order,
): SubmissionResult | Promise<SubmissionResult> =>
  configuredProvider.submit(order);
