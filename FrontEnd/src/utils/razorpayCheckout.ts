declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
}

export const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.getElementById('razorpay-checkout-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export interface RazorpayOrderPayload {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  invoiceCode: string;
  patientName: string;
  description: string;
}

export const openRazorpayCheckout = async (
  order: RazorpayOrderPayload,
  onSuccess: (response: RazorpaySuccessResponse) => void | Promise<void>,
  onDismiss?: () => void
) => {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error('Could not load Razorpay checkout');
  }

  const rzp = new window.Razorpay({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    name: 'Ayurveda Health',
    description: order.description || `Invoice ${order.invoiceCode}`,
    order_id: order.orderId,
    prefill: { name: order.patientName },
    theme: { color: '#4a6741' },
    handler: (response) => {
      void onSuccess(response);
    },
    modal: {
      ondismiss: onDismiss,
    },
  });

  rzp.on('payment.failed', (response) => {
    throw new Error(response.error?.description || 'Payment failed');
  });

  rzp.open();
};
