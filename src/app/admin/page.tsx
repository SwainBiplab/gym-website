import Link from "next/link";
import { addDays, format, startOfDay, startOfMonth, subDays, subMonths } from "date-fns";
import { Users, CreditCard, DollarSign, Activity, AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { expireLapsedSubscriptions } from "@/lib/membership";
import { money, fmtDate, ago } from "@/lib/utils";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { SeriesChart } from "@/components/charts/line-chart";
import { StatusBadge } from "@/components/ui/badge";
import { SessionList } from "@/components/app/session-list";

export default async function AdminHome() {
  await requireUser(["ADMIN"]);
  await expireLapsedSubscriptions();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const [members, activeSubs, pastDue, revenueMonth, revenuePrev, checkinsToday, pendingPayments, expiring, recentMembers, todaySessions, checkins14] = await Promise.all([
    db.user.count({ where: { role: "MEMBER" } }),
    db.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING"] }, currentPeriodEnd: { gte: now } } }),
    db.subscription.count({ where: { status: "PAST_DUE" } }),
    db.payment.aggregate({ _sum: { amountCents: true }, where: { status: "PAID", paidAt: { gte: monthStart } } }),
    db.payment.aggregate({ _sum: { amountCents: true }, where: { status: "PAID", paidAt: { gte: subMonths(monthStart, 1), lt: monthStart } } }),
    db.checkIn.count({ where: { checkedInAt: { gte: startOfDay(now) } } }),
    db.payment.findMany({ where: { status: "PENDING" }, include: { user: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.subscription.findMany({ where: { status: { in: ["ACTIVE", "TRIALING"] }, currentPeriodEnd: { gte: now, lte: addDays(now, 7) } }, include: { user: true, plan: true }, orderBy: { currentPeriodEnd: "asc" }, take: 6 }),
    db.user.findMany({ where: { role: "MEMBER" }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.classSession.findMany({
      where: { startsAt: { gte: startOfDay(now), lt: addDays(startOfDay(now), 1) } },
      include: { gymClass: { include: { trainer: true } }, _count: { select: { bookings: { where: { status: { in: ["CONFIRMED", "ATTENDED"] } } } } } },
      orderBy: { startsAt: "asc" },
    }),
    db.checkIn.findMany({ where: { checkedInAt: { gte: subDays(startOfDay(now), 13) } }, select: { checkedInAt: true } }),
  ]);
  const rev = revenueMonth._sum.amountCents ?? 0;
  const prev = revenuePrev._sum.amountCents ?? 0;
  const trend = prev > 0 ? Math.round(((rev - prev) / prev) * 100) : null;
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(startOfDay(now), 13 - i);
    const n = checkins14.filter((c) => c.checkedInAt >= d && c.checkedInAt < addDays(d, 1)).length;
    return { label: format(d, "d MMM"), date: format(d, "EEE, MMM d"), value: n };
  });

  return (
    <>
      <PageHeader eyebrow="Admin" title="Club dashboard" description={format(now, "EEEE, MMMM d")} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Members" value={members} hint={`${activeSubs} with active plans`} icon={<Users className="h-4 w-4" />} />
        <Stat label="Revenue this month" value={money(rev)} hint={trend != null ? `${trend >= 0 ? "+" : ""}${trend}% vs last month` : `Last month ${money(prev)}`} icon={<DollarSign className="h-4 w-4" />} tone="accent-2" />
        <Stat label="Check-ins today" value={checkinsToday} hint={`${todaySessions.length} classes scheduled`} icon={<Activity className="h-4 w-4" />} tone="accent-3" />
        <Stat label="Past due" value={pastDue} hint={`${pendingPayments.length} payments pending`} icon={<AlertTriangle className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Check-ins · last 14 days" />
          <SeriesChart points={days} variant="bar" decimals={0} color="#9fb3c8" />
        </Card>
        <Card>
          <CardHeader title="Today's classes" action={<Link href="/admin/classes" className="link text-sm">Manage</Link>} />
          <SessionList sessions={todaySessions} hrefBase="/trainer/sessions" empty="No classes today." />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Pending payments" action={<Link href="/admin/payments" className="link text-sm">All</Link>} />
          <ul className="divide-y divide-white/6 text-sm">
            {pendingPayments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2">
                <Link href={`/admin/members/${p.userId}`} className="link text-fg">{p.user.name}</Link>
                <span className="tabular-nums text-fg-muted">{money(p.amountCents, p.currency)}</span>
              </li>
            ))}
            {pendingPayments.length === 0 && <li className="py-2 text-fg-subtle">Nothing pending.</li>}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Expiring within 7 days" />
          <ul className="divide-y divide-white/6 text-sm">
            {expiring.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <Link href={`/admin/members/${s.userId}`} className="link text-fg">{s.user.name}</Link>
                <span className="text-fg-muted">{s.plan.name} · {fmtDate(s.currentPeriodEnd, "MMM d")}</span>
              </li>
            ))}
            {expiring.length === 0 && <li className="py-2 text-fg-subtle">No renewals due.</li>}
          </ul>
        </Card>
        <Card>
          <CardHeader title="New members" action={<Link href="/admin/members" className="link text-sm">All</Link>} />
          <ul className="divide-y divide-white/6 text-sm">
            {recentMembers.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2">
                <Link href={`/admin/members/${m.id}`} className="link text-fg">{m.name}</Link>
                <span className="text-xs text-fg-subtle">{ago(m.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <p className="mt-6 text-xs text-fg-subtle">
        <CreditCard className="mr-1 inline h-3 w-3" /> Subscription statuses: <StatusBadge status="ACTIVE" /> <StatusBadge status="TRIALING" /> <StatusBadge status="PAST_DUE" /> <StatusBadge status="EXPIRED" />
      </p>
    </>
  );
}
