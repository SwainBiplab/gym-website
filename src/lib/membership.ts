import "server-only";
import { addDays, addMonths, addYears, startOfWeek, endOfWeek } from "date-fns";
import type { BillingInterval, Plan } from "@prisma/client";
import { db } from "./db";

export const ACTIVE_STATUSES = ["ACTIVE", "TRIALING", "PAST_DUE"] as const;

export function periodEnd(from: Date, interval: BillingInterval, count = 1) {
  return interval === "YEAR" ? addYears(from, count) : addMonths(from, count);
}

export function trialEnd(from: Date, trialDays: number) {
  return addDays(from, trialDays);
}

export async function getActiveSubscription(userId: string) {
  return db.subscription.findFirst({
    where: { userId, status: { in: [...ACTIVE_STATUSES] }, currentPeriodEnd: { gte: new Date() } },
    include: { plan: true },
    orderBy: { currentPeriodEnd: "desc" },
  });
}

export async function hasActiveMembership(userId: string) {
  return !!(await getActiveSubscription(userId));
}

/** Count confirmed bookings this week for plans that cap classes per week. */
export async function classesBookedThisWeek(userId: string, when: Date) {
  return db.booking.count({
    where: {
      userId,
      status: { in: ["CONFIRMED", "ATTENDED"] },
      session: { startsAt: { gte: startOfWeek(when, { weekStartsOn: 1 }), lte: endOfWeek(when, { weekStartsOn: 1 }) } },
    },
  });
}

/** Mark expired subscriptions. Cheap enough to call opportunistically. */
export async function expireLapsedSubscriptions() {
  await db.subscription.updateMany({
    where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] }, source: "OFFLINE", currentPeriodEnd: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
}

export function describePlan(plan: Plan) {
  const per = plan.interval === "YEAR" ? "yr" : "mo";
  return `${plan.name} · ${(plan.priceCents / 100).toFixed(2)} ${plan.currency.toUpperCase()}/${per}`;
}
