import "server-only";
import Stripe from "stripe";

export const billingMode = (): "stripe" | "offline" =>
  process.env.BILLING_MODE === "stripe" && !!process.env.STRIPE_SECRET_KEY ? "stripe" : "offline";

let client: Stripe | null = null;
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not configured");
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

/** Newer Stripe API versions keep period dates on the subscription items. */
export function subscriptionPeriod(sub: Stripe.Subscription) {
  const legacy = sub as unknown as { current_period_start?: number; current_period_end?: number };
  const item = sub.items?.data?.[0] as unknown as { current_period_start?: number; current_period_end?: number } | undefined;
  const start = legacy.current_period_start ?? item?.current_period_start;
  const end = legacy.current_period_end ?? item?.current_period_end;
  return {
    start: start ? new Date(start * 1000) : new Date(),
    end: end ? new Date(end * 1000) : new Date(Date.now() + 30 * 86400000),
  };
}

export function mapStripeStatus(s: Stripe.Subscription.Status) {
  switch (s) {
    case "active":
      return "ACTIVE" as const;
    case "trialing":
      return "TRIALING" as const;
    case "past_due":
    case "unpaid":
      return "PAST_DUE" as const;
    case "canceled":
      return "CANCELED" as const;
    case "paused":
      return "PAUSED" as const;
    case "incomplete":
    case "incomplete_expired":
    default:
      return "INCOMPLETE" as const;
  }
}
