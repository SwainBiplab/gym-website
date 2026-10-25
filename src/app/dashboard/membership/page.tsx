import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { billingMode } from "@/lib/stripe";
import { getActiveSubscription } from "@/lib/membership";
import { fmtDate, money } from "@/lib/utils";
import { subscribeAction, cancelSubscriptionAction, resumeSubscriptionAction, billingPortalAction } from "@/actions/subscription";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { PlanCard } from "@/components/site/plan-card";
import { ActionButton } from "@/components/forms/action-button";
import { Button } from "@/components/ui/button";

export default async function MembershipPage({ searchParams }: { searchParams: Promise<{ plan?: string; checkout?: string; activated?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const [sub, plans, history] = await Promise.all([
    getActiveSubscription(user.id),
    db.plan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.subscription.findMany({ where: { userId: user.id }, include: { plan: true }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);
  const mode = billingMode();

  return (
    <>
      <PageHeader eyebrow="Membership" title="Your membership" description={mode === "stripe" ? "Secure card payments powered by Stripe." : "Pay at the front desk. Your plan activates right away."} />
      {sp.checkout === "success" && <p className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">Payment received! Your membership will show as active within a few seconds.</p>}
      {sp.checkout === "canceled" && <p className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">Checkout canceled. No charge was made.</p>}
      {sp.activated && <p className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">Your membership is active. Welcome to the club!</p>}

      <Card strong className="mb-8">
        <CardHeader title="Current plan" action={sub && <StatusBadge status={sub.status} />} />
        {sub ? (
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-2xl font-semibold">{sub.plan.name}</p>
              <p className="text-sm text-fg-muted">
                {money(sub.plan.priceCents, sub.plan.currency)} / {sub.plan.interval === "YEAR" ? "year" : "month"} · period {fmtDate(sub.currentPeriodStart)} → {fmtDate(sub.currentPeriodEnd)}
              </p>
              {sub.cancelAtPeriodEnd ? (
                <p className="mt-2 text-sm text-amber-300">Cancellation scheduled. Access ends {fmtDate(sub.currentPeriodEnd)}.</p>
              ) : (
                <p className="mt-2 text-sm text-fg-subtle">{sub.source === "STRIPE" ? "Renews automatically." : "Renew at the front desk before the period ends."}</p>
              )}
              {sub.plan.maxClassesPerWeek != null && <Badge className="mt-3" tone="info">{sub.plan.maxClassesPerWeek} classes / week</Badge>}
            </div>
            <div className="flex flex-wrap gap-2">
              {sub.source === "STRIPE" && mode === "stripe" && (
                <form action={billingPortalAction}>
                  <Button variant="glass" size="sm">Manage billing</Button>
                </form>
              )}
              {sub.cancelAtPeriodEnd ? (
                <ActionButton action={resumeSubscriptionAction} variant="primary">Resume membership</ActionButton>
              ) : (
                <ActionButton action={cancelSubscriptionAction} variant="danger" confirm="Cancel your membership at the end of the current period?">
                  Cancel membership
                </ActionButton>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-fg-muted">No active membership. Choose a plan below to unlock class bookings and check-in.</p>
        )}
      </Card>

      <h2 className="mb-4 text-lg font-semibold">{sub ? "Change plan" : "Choose a plan"}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => {
          const isCurrent = sub?.planId === p.id && !sub.cancelAtPeriodEnd;
          return (
            <div key={p.id} className={sp.plan === p.slug ? "ring-2 ring-accent-2/60 rounded-[1.5rem]" : ""}>
              <PlanCard
                plan={p}
                current={isCurrent}
                action={
                  isCurrent ? (
                    <Button variant="glass" className="w-full" disabled>Current plan</Button>
                  ) : (
                    <ActionButton
                      action={subscribeAction.bind(null, p.id)}
                      variant={p.popular ? "primary" : "glass"}
                      size="md"
                      className="w-full [&>button]:w-full"
                      confirm={sub ? `Switch to ${p.name}? Your current plan will be replaced.` : undefined}
                    >
                      {mode === "stripe" ? "Checkout" : sub ? "Switch plan" : p.trialDays > 0 ? "Start free trial" : "Activate"}
                    </ActionButton>
                  )
                }
              />
            </div>
          );
        })}
      </div>

      {history.length > 0 && (
        <Card className="mt-8">
          <CardHeader title="Membership history" />
          <ul className="divide-y divide-white/6 text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span>
                  {h.plan.name} <span className="text-fg-subtle">· {fmtDate(h.currentPeriodStart)} → {fmtDate(h.currentPeriodEnd)}</span>
                </span>
                <StatusBadge status={h.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
