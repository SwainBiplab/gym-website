"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { billingMode, stripe } from "@/lib/stripe";
import { getActiveSubscription, periodEnd, trialEnd } from "@/lib/membership";
import { audit, notify, notifyAdmins } from "@/lib/activity";
import { appUrl, sendMail, layout } from "@/lib/mail";
import type { FormState } from "@/lib/validation";

export async function subscribeAction(planId: string): Promise<FormState> {
  const user = await requireUser();
  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.active) return { error: "That plan is not available." };

  const current = await getActiveSubscription(user.id);
  if (current && current.planId === plan.id && !current.cancelAtPeriodEnd) return { error: "You are already on this plan." };

  if (billingMode() === "stripe") {
    const s = stripe();
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await s.customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } });
      customerId = customer.id;
      await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }
    const session = await s.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      allow_promotion_codes: true,
      line_items: [
        {
          quantity: 1,
          ...(plan.stripePriceId
            ? { price: plan.stripePriceId }
            : {
                price_data: {
                  currency: plan.currency,
                  unit_amount: plan.priceCents,
                  recurring: { interval: plan.interval === "YEAR" ? "year" : "month", interval_count: plan.intervalCount },
                  product_data: { name: `${plan.name} membership`, description: plan.description ?? undefined },
                },
              }),
        },
      ],
      subscription_data: {
        metadata: { userId: user.id, planId: plan.id },
        ...(plan.trialDays > 0 ? { trial_period_days: plan.trialDays } : {}),
      },
      metadata: { userId: user.id, planId: plan.id },
      success_url: appUrl("/dashboard/membership?checkout=success"),
      cancel_url: appUrl("/dashboard/membership?checkout=canceled"),
    });
    redirect(session.url!);
  }

  // Offline mode: activate now, pay at the front desk (admin records the payment).
  const now = new Date();
  const trial = plan.trialDays > 0 && !current;
  const end = trial ? trialEnd(now, plan.trialDays) : periodEnd(now, plan.interval, plan.intervalCount);

  const sub = await db.$transaction(async (tx) => {
    if (current) {
      await tx.subscription.update({ where: { id: current.id }, data: { status: "CANCELED", canceledAt: now, cancelAtPeriodEnd: false } });
    }
    const created = await tx.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: trial ? "TRIALING" : "ACTIVE",
        source: "OFFLINE",
        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd: end,
      },
    });
    if (!trial) {
      await tx.payment.create({
        data: {
          userId: user.id,
          subscriptionId: created.id,
          amountCents: plan.priceCents,
          currency: plan.currency,
          status: "PENDING",
          method: "CASH",
          description: `${plan.name} membership · pay at front desk`,
        },
      });
    }
    return created;
  });

  await notify(user.id, "Membership activated", `Your ${plan.name} membership is active until ${end.toDateString()}.`, "/dashboard/membership");
  await notifyAdmins("New subscription", `${user.name} subscribed to ${plan.name} (offline, payment pending).`, `/admin/members/${user.id}`);
  await audit(user.id, "subscription.create", "Subscription", sub.id, { planId: plan.id, mode: "offline" });
  await sendMail({
    to: user.email,
    subject: `Your ${plan.name} membership is active`,
    html: layout("You're in!", `<p>Your <b>${plan.name}</b> membership is active until ${end.toDateString()}.</p>`),
  });
  revalidatePath("/dashboard");
  redirect("/dashboard/membership?activated=1");
}

export async function cancelSubscriptionAction(): Promise<FormState> {
  const user = await requireUser();
  const sub = await getActiveSubscription(user.id);
  if (!sub) return { error: "No active membership to cancel." };
  if (sub.stripeSubscriptionId && billingMode() === "stripe") {
    await stripe().subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
  }
  await db.subscription.update({ where: { id: sub.id }, data: { cancelAtPeriodEnd: true, canceledAt: new Date() } });
  await audit(user.id, "subscription.cancel", "Subscription", sub.id);
  await notifyAdmins("Membership cancellation", `${user.name} canceled ${sub.plan.name} (ends ${sub.currentPeriodEnd.toDateString()}).`, `/admin/members/${user.id}`);
  revalidatePath("/dashboard/membership");
  return { ok: true, message: `Your membership will end on ${sub.currentPeriodEnd.toDateString()}.` };
}

export async function resumeSubscriptionAction(): Promise<FormState> {
  const user = await requireUser();
  const sub = await getActiveSubscription(user.id);
  if (!sub || !sub.cancelAtPeriodEnd) return { error: "Nothing to resume." };
  if (sub.stripeSubscriptionId && billingMode() === "stripe") {
    await stripe().subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: false });
  }
  await db.subscription.update({ where: { id: sub.id }, data: { cancelAtPeriodEnd: false, canceledAt: null } });
  await audit(user.id, "subscription.resume", "Subscription", sub.id);
  revalidatePath("/dashboard/membership");
  return { ok: true, message: "Your membership will continue to renew." };
}

export async function billingPortalAction() {
  const user = await requireUser();
  if (billingMode() !== "stripe" || !user.stripeCustomerId) redirect("/dashboard/membership");
  const session = await stripe().billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: appUrl("/dashboard/membership") });
  redirect(session.url);
}
