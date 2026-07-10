import crypto from 'crypto';
import { jest } from '@jest/globals';

const TEST_KEY_SECRET = 'test_razorpay_secret';
const TEST_WEBHOOK_SECRET = 'test_webhook_secret';

const withEnv = async (overrides, fn) => {
  const previous = { ...process.env };
  Object.assign(process.env, overrides);
  jest.resetModules();
  try {
    await fn(await import('../services/payment/razorpay.service.js'));
  } finally {
    process.env = previous;
    jest.resetModules();
  }
};

describe('razorpay.service', () => {
  it('isRazorpayEnabled returns false when disabled', async () => {
    await withEnv(
      {
        RAZORPAY_ENABLED: 'false',
        RAZORPAY_KEY_ID: 'rzp_test_abc',
        RAZORPAY_KEY_SECRET: 'secret',
      },
      async ({ isRazorpayEnabled }) => {
        expect(isRazorpayEnabled()).toBe(false);
      }
    );
  });

  it('isRazorpayEnabled returns true when all vars set', async () => {
    await withEnv(
      {
        RAZORPAY_ENABLED: 'true',
        RAZORPAY_KEY_ID: 'rzp_test_abc',
        RAZORPAY_KEY_SECRET: 'secret',
      },
      async ({ isRazorpayEnabled }) => {
        expect(isRazorpayEnabled()).toBe(true);
      }
    );
  });

  it('verifyRazorpayPaymentSignature accepts valid HMAC', async () => {
    const orderId = 'order_test_123';
    const paymentId = 'pay_test_456';
    const body = `${orderId}|${paymentId}`;
    const signature = crypto.createHmac('sha256', TEST_KEY_SECRET).update(body).digest('hex');

    await withEnv(
      {
        RAZORPAY_KEY_SECRET: TEST_KEY_SECRET,
      },
      async ({ verifyRazorpayPaymentSignature }) => {
        expect(
          verifyRazorpayPaymentSignature({ orderId, paymentId, signature })
        ).toBe(true);
      }
    );
  });

  it('verifyRazorpayPaymentSignature rejects tampered signature', async () => {
    await withEnv(
      {
        RAZORPAY_KEY_SECRET: TEST_KEY_SECRET,
      },
      async ({ verifyRazorpayPaymentSignature }) => {
        expect(
          verifyRazorpayPaymentSignature({
            orderId: 'order_test_123',
            paymentId: 'pay_test_456',
            signature: 'invalid_signature',
          })
        ).toBe(false);
      }
    );
  });

  it('verifyRazorpayWebhookSignature accepts valid webhook body', async () => {
    const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured' }));
    const signature = crypto
      .createHmac('sha256', TEST_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    await withEnv(
      {
        RAZORPAY_WEBHOOK_SECRET: TEST_WEBHOOK_SECRET,
      },
      async ({ verifyRazorpayWebhookSignature }) => {
        expect(verifyRazorpayWebhookSignature(rawBody, signature)).toBe(true);
      }
    );
  });

  it('mapRazorpayMethod maps gateway methods to invoice labels', async () => {
    await withEnv({}, async ({ mapRazorpayMethod }) => {
      expect(mapRazorpayMethod('card')).toBe('Card');
      expect(mapRazorpayMethod('netbanking')).toBe('Net Banking');
      expect(mapRazorpayMethod('upi')).toBe('UPI');
      expect(mapRazorpayMethod('wallet')).toBe('UPI');
    });
  });
});
