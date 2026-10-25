import Link from "next/link";
import { startOfMonth } from "date-fns";
import { CalendarCheck, Clock, Megaphone, AlertTriangle } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getActiveSubscription, expireLapsedSubscriptions } from "@/lib/membership";
import { fmtDate, fmtDateTime, ago } from "@/lib/utils";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { resendVerificationAction } from "@/actions/auth";
import { ActionButton } from "@/components/forms/action-button";
import { ProgressRing } from "@/components/brand/progress-ring";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ welcome?: string; verified?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  await expireLapsedSubscriptions();
  const now = new Date();
  const [sub, upcoming, monthCheckIns, lastCheckIn, announcements, bookingsCount] = await Promise.all([
    getActiveSubscription(user.id),
    db.booking.findMany({
      where: { userId: user.id, status: { in: ["CONFIRMED", "WAITLISTED"] }, session: { startsAt: { gte: now } } },
      include: { session: { include: { gymClass: { include: { trainer: true } } } } },
      orderBy: { session: { startsAt: "asc" } },
      take: 4,
    }),
    db.checkIn.count({ where: { userId: user.id, checkedInAt: { gte: startOfMonth(now) } } }),
    db.checkIn.findFirst({ where: { userId: user.id }, orderBy: { checkedInAt: "desc" } }),
    db.announcement.findMany({ where: { published: true }, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 3 }),
    db.booking.count({ where: { userId: user.id, status: "ATTENDED" } }),
  ]);
  const daysLeft = sub ? Math.max(0, Math.ceil((sub.currentPeriodEnd.getTime() - now.getTime()) / 86400000)) : 0;
  const first = user.name.split(" ")[0];

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={sp.welcome ? `Welcome, ${first}!` : `Hey ${first} 👋`}
        description={sub ? `${sub.plan.name} member · ${daysLeft} days left in this period.` : "You don't have an active membership yet."}
        action={!sub && <ButtonLink href="/dashboard/membership">Choose a plan</ButtonLink>}
      />
      {sp.verified === "1" && <p className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">Email verified. Thanks!</p>}
      {!user.emailVerifiedAt && (
        <div className="glass glass-sm mb-6 flex flex-wrap items-center justify-between gap-3 border-amber-400/30 p-4">
          <p className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-300" /> Please verify your email address. Check your inbox for the link.
          </p>
          <ActionButton action={resendVerificationAction}>Resend email</ActionButton>
        </div>
      )}
      {sub?.status === "PAST_DUE" && (
        <div className="glass glass-sm mb-6 border-accent-3/40 p-4 text-sm">
          <b className="text-accent-3">Payment overdue.</b> Your membership is past due. Please update your payment or visit the front desk to keep access.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass glass-sm glass-hover flex items-center gap-4 p-5">
          <ProgressRing
            value={sub ? 1 - daysLeft / Math.max(1, Math.round((sub.currentPeriodEnd.getTime() - sub.currentPeriodStart.getTime()) / 864e5)) : 0}
            size={72}
            stroke={6}
            tone={sub?.status === "PAST_DUE" ? "coral" : sub ? "lime" : "steel"}
            label={sub ? `${daysLeft}d` : "—"}
            sublabel="left"
          />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">Membership</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-semibold">{sub ? sub.plan.name : "None"} {sub && <StatusBadge status={sub.status} />}</p>
            <p className="mt-1 text-[13px] text-fg-subtle">{sub ? `Renews ${fmtDate(sub.currentPeriodEnd)}` : "Pick a plan to get started"}</p>
          </div>
        </div>
        <Stat label="Visits this month" value={monthCheckIns} hint={lastCheckIn ? `Last visit ${ago(lastCheckIn.checkedInAt)}` : "No visits yet"} icon={<Clock className="h-4 w-4" />} tone="accent-2" />
        <Stat label="Classes attended" value={bookingsCount} hint="All time" icon={<CalendarCheck className="h-4 w-4" />} tone="accent-3" />
        <Stat label="Upcoming bookings" value={upcoming.length} hint={upcoming[0] ? `Next: ${fmtDateTime(upcoming[0].session.startsAt)}` : "Nothing booked"} icon={<CalendarCheck className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="rise rise-2">
          <CardHeader title="Your next classes" action={<Link href="/dashboard/classes" className="link text-sm">Book more</Link>} />
          {upcoming.length === 0 ? (
            <p className="text-sm text-fg-muted">No upcoming classes. {sub ? "Browse the schedule and grab a spot." : "Activate a membership to book classes."}</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((b) => (
                <li key={b.id} className="glass glass-sm flex items-center gap-3 p-3">
                  <span className="h-10 w-1.5 rounded-full" style={{ background: b.session.gymClass.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{b.session.gymClass.name}</p>
                    <p className="text-xs text-fg-muted">
                      {fmtDateTime(b.session.startsAt)} · {b.session.gymClass.trainer?.name ?? "Staff"} · {b.session.gymClass.location}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="rise rise-3">
          <CardHeader title="Club news" />
          <ul className="space-y-4">
            {announcements.map((a) => (
              <li key={a.id}>
                <p className="flex items-center gap-2 font-medium">
                  <Megaphone className="h-4 w-4 text-accent-2" /> {a.title}
                </p>
                <p className="mt-1 text-sm text-fg-muted">{a.body}</p>
                <p className="mt-1 text-xs text-fg-subtle">{ago(a.createdAt)}</p>
              </li>
            ))}
            {announcements.length === 0 && <li className="text-sm text-fg-muted">No announcements yet.</li>}
          </ul>
        </Card>
      </div>
      {sub && daysLeft <= 7 && sub.source === "OFFLINE" && (
        <div className="glass glass-sm mt-6 p-4 text-sm">
          Your membership ends on <b>{fmtDate(sub.currentPeriodEnd)}</b>. Renew at the front desk or <Link href="/dashboard/membership" className="link">choose a plan</Link> to continue.
        </div>
      )}
    </>
  );
}
