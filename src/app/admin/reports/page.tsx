import { addMonths, format, startOfMonth, subMonths, subDays, startOfDay, getHours } from "date-fns";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { SeriesChart } from "@/components/charts/line-chart";
import { Table, Th, Td } from "@/components/ui/table";

export default async function ReportsPage() {
  await requireUser(["ADMIN"]);
  const now = new Date();
  const from = startOfMonth(subMonths(now, 11));
  const [payments, signups, checkins, classStats, planMix] = await Promise.all([
    db.payment.findMany({ where: { status: "PAID", paidAt: { gte: from } }, select: { amountCents: true, paidAt: true } }),
    db.user.findMany({ where: { role: "MEMBER", createdAt: { gte: from } }, select: { createdAt: true } }),
    db.checkIn.findMany({ where: { checkedInAt: { gte: subDays(startOfDay(now), 30) } }, select: { checkedInAt: true } }),
    db.gymClass.findMany({
      where: { active: true },
      include: { sessions: { where: { startsAt: { gte: subDays(now, 30), lte: now } }, include: { _count: { select: { bookings: { where: { status: { in: ["ATTENDED", "CONFIRMED"] } } } } } } } },
    }),
    db.subscription.groupBy({ by: ["planId"], where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } }, _count: { _all: true } }),
  ]);
  const plans = await db.plan.findMany();
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = addMonths(from, i);
    const next = addMonths(m, 1);
    return {
      label: format(m, "MMM"),
      date: format(m, "MMMM yyyy"),
      revenue: payments.filter((p) => p.paidAt! >= m && p.paidAt! < next).reduce((a, p) => a + p.amountCents, 0) / 100,
      signups: signups.filter((u) => u.createdAt >= m && u.createdAt < next).length,
    };
  });
  const hours = Array.from({ length: 18 }, (_, i) => i + 5).map((h) => ({ label: `${h}:00`, value: checkins.filter((c) => getHours(c.checkedInAt) === h).length }));
  const classRows = classStats
    .map((c) => {
      const sessions = c.sessions.length;
      const booked = c.sessions.reduce((a, s) => a + s._count.bookings, 0);
      return { name: c.name, sessions, booked, fill: sessions ? Math.round((booked / (sessions * c.capacity)) * 100) : 0 };
    })
    .sort((a, b) => b.fill - a.fill);

  return (
    <>
      <PageHeader eyebrow="Insights" title="Reports" description="Revenue, growth, and utilization over the last 12 months." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Revenue by month" description="Paid payments, last 12 months" />
          <SeriesChart points={months.map((m) => ({ label: m.label, date: m.date, value: m.revenue }))} variant="bar" decimals={0} color="var(--accent)" format="money" />
        </Card>
        <Card>
          <CardHeader title="New members by month" />
          <SeriesChart points={months.map((m) => ({ label: m.label, date: m.date, value: m.signups }))} variant="bar" decimals={0} color="#9fb3c8" />
        </Card>
        <Card>
          <CardHeader title="Busiest hours" description="Check-ins by hour, last 30 days" />
          <SeriesChart points={hours} variant="bar" decimals={0} color="#ff7a7a" />
        </Card>
        <Card>
          <CardHeader title="Plan mix" description="Active subscriptions per plan" />
          <ul className="space-y-3">
            {planMix
              .map((r) => ({ name: plans.find((p) => p.id === r.planId)?.name ?? "?", n: r._count._all }))
              .sort((a, b) => b.n - a.n)
              .map((r) => {
                const total = planMix.reduce((a, x) => a + x._count._all, 0) || 1;
                return (
                  <li key={r.name}>
                    <div className="mb-1 flex justify-between text-sm"><span>{r.name}</span><span className="text-fg-muted">{r.n} · {Math.round((r.n / total) * 100)}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2" style={{ width: `${(r.n / total) * 100}%` }} /></div>
                  </li>
                );
              })}
          </ul>
        </Card>
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Class utilization · last 30 days</h2>
      <Table>
        <thead><tr><Th>Class</Th><Th>Sessions</Th><Th>Bookings</Th><Th>Fill rate</Th></tr></thead>
        <tbody>
          {classRows.map((r) => (
            <tr key={r.name}>
              <Td className="font-medium">{r.name}</Td><Td>{r.sessions}</Td><Td>{r.booked}</Td>
              <Td><span className={r.fill >= 80 ? "text-emerald-300" : r.fill >= 50 ? "text-amber-300" : "text-fg-muted"}>{r.fill}%</span></Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
