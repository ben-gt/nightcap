// Single integration seam for charging guests at booking time.
//
// Today: runs in MOCK mode (no real charge) — matches the prior `setTimeout`
// stub but exposes the shape we'll need. Switch to real charges by:
//   1. Setting EXPO_PUBLIC_AIRWALLEX_ENV (`demo` | `prod`) and
//      EXPO_PUBLIC_AIRWALLEX_PUBLISHABLE_KEY in .env.deploy
//   2. Standing up a backend endpoint that creates an Airwallex PaymentIntent
//      and returns its `client_secret` (Airwallex requires the secret key
//      server-side; do NOT ship it in the Expo bundle)
//   3. Replacing the MOCK branch below with the Airwallex JS SDK Drop-in
//      Element flow (`@airwallex/components-sdk`)

export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  guestEmail: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

const AIRWALLEX_ENV = process.env.EXPO_PUBLIC_AIRWALLEX_ENV;
const AIRWALLEX_KEY = process.env.EXPO_PUBLIC_AIRWALLEX_PUBLISHABLE_KEY;
const PAYMENT_INTENT_ENDPOINT = process.env.EXPO_PUBLIC_PAYMENT_INTENT_ENDPOINT;

export function isPaymentMockMode(): boolean {
  return !AIRWALLEX_ENV || !AIRWALLEX_KEY || !PAYMENT_INTENT_ENDPOINT;
}

export async function processBookingPayment(req: PaymentRequest): Promise<PaymentResult> {
  if (isPaymentMockMode()) {
    // Mock mode: simulate latency, always succeed. No real money moves.
    await new Promise((r) => setTimeout(r, 1500));
    return {
      success: true,
      paymentIntentId: `mock_${Date.now()}`,
    };
  }

  // Real Airwallex flow goes here once a backend exists. Sketch:
  //
  //   const intent = await fetch(PAYMENT_INTENT_ENDPOINT!, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(req),
  //   }).then((r) => r.json());
  //
  //   const { confirmPaymentIntent } = await import('@airwallex/components-sdk');
  //   const result = await confirmPaymentIntent({
  //     intent_id: intent.id,
  //     client_secret: intent.client_secret,
  //     // ...card element ref / payment method
  //   });
  //
  //   return result.status === 'SUCCEEDED'
  //     ? { success: true, paymentIntentId: intent.id }
  //     : { success: false, error: result.message ?? 'Payment failed' };

  return {
    success: false,
    error: 'Live payments are not yet wired up on this build.',
  };
}
