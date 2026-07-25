import type { SubmissionProvider } from './submission-provider';
import type { Order } from '../../../types/order';
import type { SubmissionResult } from '../../../types/submission';

interface AppsScriptResponse {
  success: boolean;
  orderId?: string;
  message?: string;
  error?: string;
}

const providerName = 'apps-script';

const getEndpoint = (): string | null => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_ORDER_ENDPOINT) {
    return import.meta.env.PUBLIC_ORDER_ENDPOINT;
  }
  return null;
};

const getToken = (): string | null => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_ORDER_TOKEN) {
    return import.meta.env.PUBLIC_ORDER_TOKEN;
  }
  return null;
};

const validateOrder = (order: Order): string | null => {
  if (!order || !Array.isArray(order.items) || order.items.length === 0) {
    return 'Order is missing required item details.';
  }

  if (!order.customer?.name?.trim()) {
    return 'Customer name is required.';
  }

  if (!order.customer?.email?.trim()) {
    return 'Customer email is required.';
  }

  for (const item of order.items) {
    if (!item.productId || !item.productTitle) {
      return 'One or more items are missing required product details.';
    }
  }

  return null;
};

const buildPayload = (order: Order) => {
  const payload: Record<string, unknown> = {
    source: 'ripple-website',
    order,
  };

  const token = getToken();
  if (token) {
    payload.token = token;
  }

  return payload;
};

export const appsScriptSubmissionProvider: SubmissionProvider = {
  name: providerName,

  async submit(order: Order): Promise<SubmissionResult> {
    const error = validateOrder(order);

    if (error) {
      return {
        success: false,
        providerName,
        error,
      };
    }

    const endpoint = getEndpoint();

    if (!endpoint) {
      return {
        success: false,
        providerName,
        error:
          'Order endpoint is not configured. Set PUBLIC_ORDER_ENDPOINT in your environment.',
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(buildPayload(order)),
      });

      if (response.ok) {
        try {
          const data = (await response.json()) as AppsScriptResponse;

          if (data.success) {
            return {
              success: true,
              providerName,
              message: data.message || 'Your order has been submitted.',
              externalReferenceId: data.orderId,
            };
          }

          return {
            success: false,
            providerName,
            error: data.error || 'The order service rejected the request.',
          };
        } catch {
          return {
            success: true,
            providerName,
            message: 'Order submitted. We will confirm your order shortly.',
          };
        }
      }

      if (response.type === 'opaque') {
        return {
          success: true,
          providerName,
          message: 'Order submitted. We will confirm your order shortly.',
        };
      }

      return {
        success: false,
        providerName,
        error: `Server returned status ${response.status}. Please try again later.`,
      };
    } catch (err) {
      const message =
        err instanceof TypeError
          ? 'Could not reach the order service. Please check your connection and try again.'
          : err instanceof Error
            ? err.message
            : 'An unexpected error occurred. Please try again.';

      return {
        success: false,
        providerName,
        error: message,
      };
    }
  },
};
