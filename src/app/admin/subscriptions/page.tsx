import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate, money } from "@/lib/utils";
import { expireLapsedSubscriptions } from "@/lib/membership";
import { PageHeader } from "@/components/ui/card";
import { Table, Th, Td, CellText } from "@/components/ui/table";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { FilterBar } from "@/components/ui/filter-bar";
import { ProgressRing } from "@/components/brand/progress-ring";

const STATUSES = ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED", "EXPIRED", "PAUSED", "INCOMPLETE"] as const;

export default async function SubscriptionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireUser(["ADMIN"]);
  await expireLapsedSubscriptions();
  const { status } = await searchParams;
  const valid = (STATUSES as readonly string[]).includes(status ?? "") ? (status as (typeof STATUSES)[number]) : undefined;
  const [subs, counts, mrrRows] = await Promise.all([
    db.subscription.findMany({ where: valid ? { status: valid } : {}, include: { user: true, plan: true }, orderBy: { currentPeriodEnd: "asc" }, take: 200 }),
    db.subscription.groupBy({ by: ["status"], _count: { _all: true } }),
    db.subscription.findMany({ where: { status: { in: ["ACTIVE", "PAST_DUE"] } }, include: { plan: true } }),
  ]);
  const mrr = mrrRows.reduce((a, s) => a + (s.plan.interval === "YEAR" ? s.plan.priceCents / (12 * s.plan.intervalCount) : s.plan.priceCents / s.plan.intervalCount), 0);
  const count = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const now = new Date().getTime();

  return (
    <>
      <PageHeader eyebrow="Billing" title="Subscriptions" description="Every membership with where it is in its billing period." />
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Stat label="MRR (normalized)" value={money(Math.round(mrr))} hint="Annual plans ÷ 12" />
        <Stat label="Active" value={count("ACTIVE") + count("TRIALING")} hint={`${count("TRIALING")} on trial`} />
        <Stat label="Past due" value={count("PAST_DUE")} tone="accent-3" />
        <Stat label="Churned" value={count("CANCELED") + count("EXPIRED")} hint="Canceled + expired" tone="accent-2" />
      </div>
      <FilterBar
        basePath="/admin/subscriptions"
        active={valid ?? ""}
        pills={[{ value: "", label: "All" }, ...STATUSES.map((s) => ({ value: s, label: s.toLowerCase().replace("_", " "), count: count(s) }))]}
      />
      <Table>
        <thead>
          <tr>
            <Th>Member</Th>
            <Th>Plan</Th>
            <Th>Status</Th>
            <Th>Billing period</Th>
            <Th className="hidden md:table-cell">Source</Th>
          </tr>
        </thead>
        <tbody>
          {subs.map((s) => {
            const span = s.currentPeriodEnd.getTime() - s.currentPeriodStart.getTime();
            const used = Math.max(0, Math.min(1, span > 0 ? (now - s.currentPeriodStart.getTime()) / span : 1));
            const daysLeft = Math.max(0, Math.ceil((s.currentPeriodEnd.getTime() - now) / 864e5));
            return (
              <tr key={s.id}>
                <Td><CellText primary={<Link href={`/admin/members/${s.userId}`} className="link text-fg">{s.user.name}</Link>} secondary={s.user.email} /></Td>
                <Td><CellText primary={s.plan.name} secondary={`${money(s.plan.priceCents, s.plan.currency)} / ${s.plan.interval === "YEAR" ? "year" : "month"}`} /></Td>
                <Td>
                  <span className="flex items-center gap-1.5">
                    <StatusBadge status={s.status} />
                    {s.cancelAtPeriodEnd && <Badge tone="warning">ending</Badge>}
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center gap-3">
                    <ProgressRing value={used} size={36} stroke={4} tone={s.status === "PAST_DUE" ? "coral" : ["CANCELED", "EXPIRED"].includes(s.status) ? "steel" : "lime"}>
                      <span className="sr-only">{Math.round(used * 100)}% of period used</span>
                    </ProgressRing>
                    <CellText primary={`${daysLeft} day${daysLeft === 1 ? "" : "s"} left`} secondary={`${fmtDate(s.currentPeriodStart)} → ${fmtDate(s.currentPeriodEnd)}`} />
                  </div>
                </Td>
                <Td className="hidden md:table-cell"><Badge>{s.source === "STRIPE" ? "Stripe" : "Front desk"}</Badge></Td>
              </tr>
            );
          })}
          {subs.length === 0 && (
            <tr>
              <Td colSpan={5} className="py-10 text-center text-fg-subtle">No subscriptions in this view.</Td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  );
}
