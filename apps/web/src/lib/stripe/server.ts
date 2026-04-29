import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  return Boolean(secretKey && !secretKey.includes("replace_with"));
}

export function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret.includes("replace_with")) {
    throw new Error("Stripe webhook secret is not configured.");
  }

  return webhookSecret;
}

export function getStripeClient() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || secretKey.includes("replace_with")) {
    throw new Error("Stripe secret key is not configured.");
  }

  stripeClient = new Stripe(secretKey);

  return stripeClient;
}
