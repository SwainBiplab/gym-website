import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { stripe, subscriptionPeriod, mapStripeStatus } from "@/lib/stripe";
import { notify, audit } from "@/lib/activity";

export const runtime = "nodejs";

async function upsertFromStripeSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  const planId = sub.metadata?.planId;
  if (!userId || !planId) return;
  const period = subscriptionPeriod(sub);
  const status = mapStripeStatus(sub.status);
  const existing = await db.subscription.findUnique({ where: { stripeSubscriptionId: sub.id } });
  if (!existing) {
    // Supersede any other active subscription for this user.
    await db.subscription.updateMany({
      where: { userId, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] }, stripeSubscriptionId: { not: sub.id } },
      data: { status: "CANCELED", canceledAt: new Date() },
    });
  }
  await db.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    update: {
      status,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
    create: {
      userId,
      planId,
      status,
      source: "STRIPE",
      stripeSubscriptionId: sub.id,
      startDate: new Date(sub.start_date * 1000),
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), sig, secret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe().subscriptions.retrieve(String(session.subscription));
          await upsertFromStripeSubscription(sub);
          const userId = sub.metadata?.userId;
          if (userId) {
            await notify(userId, "Membership activated", "Thanks for subscribing! Your membership is now active.", "/dashboard/membership");
            await audit(userId, "subscription.stripe.checkout", "Subscription", sub.id);
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await upsertFromStripeSubscription(event.data.object);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;
        const user = await db.user.findUnique({ where: { stripeCustomerId: customerId } });
        if (!user) break;
        const paid = event.type === "invoice.paid";
        const subId =
          (invoice as unknown as { subscription?: string | { id: string } }).subscription ??
          (invoice.parent?.subscription_details?.subscription as string | undefined);
        const local = subId ? await db.subscription.findUnique({ where: { stripeSubscriptionId: typeof subId === "string" ? subId : subId.id } }) : null;
        await db.payment.upsert({
          where: { stripeInvoiceId: invoice.id },
          update: { status: paid ? "PAID" : "FAILED", paidAt: paid ? new Date() : null, receiptUrl: invoice.hosted_invoice_url ?? null },
          create: {
            userId: user.id,
            subscriptionId: local?.id ?? null,
            amountCents: invoice.amount_paid || invoice.amount_due || 0,
            currency: invoice.currency,
            status: paid ? "PAID" : "FAILED",
            method: "STRIPE",
            stripeInvoiceId: invoice.id,
            receiptUrl: invoice.hosted_invoice_url ?? null,
            paidAt: paid ? new Date() : null,
            description: invoice.lines?.data?.[0]?.description ?? "Membership invoice",
          },
        });
        if (!paid) {
          await notify(user.id, "Payment failed", "We couldn't charge your card. Please update your payment method.", "/dashboard/membership");
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error", err);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
