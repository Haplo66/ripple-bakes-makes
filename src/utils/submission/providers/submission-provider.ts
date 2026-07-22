import type { Order } from '../../../types/order';
import type { SubmissionResult } from '../../../types/submission';

export interface SubmissionProvider {
  name: string;
  submit(order: Order): SubmissionResult;
}
