import type { Order } from '../types/order';
import type { SubmissionResult } from '../types/submission';
import { mockSubmissionProvider } from './submission/providers/mockSubmissionProvider';

const configuredProvider = mockSubmissionProvider;

/** Single integration point for the future external order handler. */
export const submitOrder = (order: Order): SubmissionResult =>
  configuredProvider.submit(order);
