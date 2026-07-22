import type { SubmissionProvider } from './submission-provider';

const providerName = 'mock';

export const mockSubmissionProvider: SubmissionProvider = {
  name: providerName,
  submit(order) {
    if (!order || !Array.isArray(order.items) || order.items.length === 0) {
      return {
        success: false,
        providerName,
        error: 'Order is missing required item details.',
      };
    }

    return {
      success: true,
      providerName,
      message: 'Order prepared for submission',
      externalReferenceId: `temporary-${Date.now()}`,
    };
  },
};
