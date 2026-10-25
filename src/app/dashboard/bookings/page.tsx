import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDateTime } from "@/lib/utils";
import { cancelBookingAction } from "@/actions/booking";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { ActionButton } from "@/components/forms/action-button";
import { Empty } from "@/components/ui/empty";
import { ButtonLink } from "@/components/ui/button";

export default async function BookingsPage() {
  const user = await requireUser();
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    db.booking.findMany({
      where: { userId: user.id, status: { in: ["CONFIRMED", "WAITLISTED"] }, session: { startsAt: { gte: now } } },
      include: { session: { include: { gymClass: { include: { trainer: true } } } } },
      orderBy: { session: { startsAt: "asc" } },
    }),
    db.booking.findMany({
      where: { userId: user.id, OR: [{ session: { startsAt: { lt: now } } }, { status: { in: ["CANCELED", "ATTENDED", "NO_SHOW"] } }] },
      include: { session: { include: { gymClass: true } } },
      orderBy: { session: { startsAt: "desc" } },
      take: 30,
    }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Bookings" title="My bookings" action={<ButtonLink href="/dashboard/classes" size="sm">Book a class</ButtonLink>} />
      <Card className="mb-6">
        <CardHeader title="Upcoming" />
        {upcoming.length === 0 ? (
          <Empty title="Nothing booked yet" description="Find a class and reserve your spot." />
        ) : (
          <ul className="space-y-2">
            {upcoming.map((b) => (
              <li key={b.id} className="glass glass-sm flex flex-wrap items-center gap-3 p-3">
                <span className="h-10 w-1.5 rounded-full" style={{ background: b.session.gymClass.color }} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{b.session.gymClass.name}</p>
                  <p className="text-xs text-fg-muted">
                    {fmtDateTime(b.session.startsAt)} · {b.session.gymClass.trainer?.name ?? "Staff"} · {b.session.gymClass.location}
                  </p>
                </div>
                <StatusBadge status={b.status} />
                <ActionButton action={cancelBookingAction.bind(null, b.id)} variant="ghost" confirm="Cancel this booking?">Cancel</ActionButton>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card>
        <CardHeader title="History" />
        {past.length === 0 ? (
          <p className="text-sm text-fg-muted">No past bookings.</p>
        ) : (
          <ul className="divide-y divide-white/6 text-sm">
            {past.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                <span>
                  {b.session.gymClass.name} <span className="text-fg-subtle">· {fmtDateTime(b.session.startsAt)}</span>
                </span>
                <StatusBadge status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
