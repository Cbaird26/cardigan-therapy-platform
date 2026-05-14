import Stripe from "stripe";
import { safeBillingMetadata } from "./compliance";

export type CheckoutInput = {
  membershipId: string;
  planCode: string;
  priceId?: string;
  successUrl: string;
  cancelUrl: string;
};

export function stripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY;

  if (!secret) {
    return null;
  }

  return new Stripe(secret, {
    appInfo: {
      name: "Cardigan Incorporated",
      version: "0.1.0",
    },
  });
}

export async function createCheckoutSession(input: CheckoutInput) {
  const stripe = stripeClient();
  const metadata = safeBillingMetadata({
    membershipId: input.membershipId,
    planCode: input.planCode,
  });

  if (!stripe || !input.priceId) {
    return {
      configured: false,
      metadata,
      checkoutUrl: "/pricing?checkout=not-configured",
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    line_items: [{ price: input.priceId, quantity: 1 }],
    client_reference_id: input.membershipId,
    metadata,
    subscription_data: {
      metadata,
    },
  });

  return {
    configured: true,
    metadata,
    checkoutUrl: session.url,
  };
}

export function isIdempotentWebhook(eventId: string, seenEvents: Set<string>) {
  if (seenEvents.has(eventId)) {
    return false;
  }

  seenEvents.add(eventId);
  return true;
}
