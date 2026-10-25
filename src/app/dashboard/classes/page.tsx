import { addDays, format, startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/membership";
import { fmtTime, sameDay } from "@/lib/utils";
import { bookSessionAction, cancelBookingAction } from "@/actions/booking";
import { PageHeader } from "@/components/ui/card";
import { ActionButton } from "@/components/forms/action-button";
import { StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export default async function BookClassesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const user = await requireUser();
  const sub = await getActiveSubscription(user.id);
  const from = startOfDay(new Date());
  const sessions = await db.classSession.findMany({
    where: { startsAt: { gte: new Date(), lt: addDays(from, 14) }, canceled: false, gymClass: { active: true, ...(category ? { category } : {}) } },
    include: {
      gymClass: { include: { trainer: true } },
      bookings: { where: { status: { in: ["CONFIRMED", "ATTENDED", "WAITLISTED"] } }, select: { userId: true, status: true, id: true } },
    },
    orderBy: { startsAt: "asc" },
  });
  const categories = await db.gymClass.findMany({ where: { active: true }, select: { category: true }, distinct: ["category"] });
  const days = Array.from({ length: 14 }, (_, i) => addDays(from, i)).filter((d) => sessions.some((s) => sameDay(s.startsAt, d)));

  return (
    <>
      <PageHeader eyebrow="Schedule" title="Book a class" description="Next 14 days. Waitlisted bookings are promoted automatically when a spot opens." />
      {!sub && (
        <div className="glass glass-sm mb-6 flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <span>You need an active membership to book classes.</span>
          <ButtonLink href="/dashboard/membership" size="sm">Choose a plan</ButtonLink>
        </div>
      )}
      <div className="mb-6 flex flex-wrap gap-2">
        <a href="/dashboard/classes" className={`control px-4 py-1.5 text-sm ${!category ? "bg-white/15" : ""}`}>All</a>
        {categories.map((c) => (
          <a key={c.category} href={`/dashboard/classes?category=${encodeURIComponent(c.category)}`} className={`control px-4 py-1.5 text-sm ${category === c.category ? "bg-white/15" : ""}`}>
            {c.category}
          </a>
        ))}
      </div>
      <div className="space-y-8">
        {days.map((d) => (
          <section key={d.toISOString()}>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-fg-muted">
              {sameDay(d, new Date()) ? "Today" : sameDay(d, addDays(new Date(), 1)) ? "Tomorrow" : format(d, "EEEE")} <span className="text-fg-subtle">· {format(d, "MMM d")}</span>
            </h2>
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sessions
                .filter((s) => sameDay(s.startsAt, d))
                .map((s) => {
                  const cap = s.capacity ?? s.gymClass.capacity;
                  const taken = s.bookings.filter((b) => b.status !== "WAITLISTED").length;
                  const mine = s.bookings.find((b) => b.userId === user.id);
                  const left = cap - taken;
                  return (
                    <li key={s.id} className="glass glass-sm glass-hover flex flex-col p-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-1 h-10 w-1.5 rounded-full" style={{ background: s.gymClass.color }} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{s.gymClass.name}</p>
                          <p className="text-xs text-fg-muted">
                            {fmtTime(s.startsAt)} – {fmtTime(s.endsAt)} · {s.gymClass.location}
                          </p>
                          <p className="text-xs text-fg-subtle">
                            {s.gymClass.trainer?.name ?? "Staff"} · {s.gymClass.level}
                          </p>
                        </div>
                        {mine && <StatusBadge status={mine.status} />}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className={`text-xs ${left <= 0 ? "text-accent-3" : left <= 3 ? "text-amber-300" : "text-fg-muted"}`}>
                          {left <= 0 ? `Full · ${s.bookings.filter((b) => b.status === "WAITLISTED").length} waiting` : `${left} of ${cap} spots left`}
                        </span>
                        {mine ? (
                          <ActionButton action={cancelBookingAction.bind(null, mine.id)} variant="ghost">Cancel</ActionButton>
                        ) : (
                          <ActionButton action={bookSessionAction.bind(null, s.id)} variant={left <= 0 ? "glass" : "primary"}>
                            {left <= 0 ? "Join waitlist" : "Book"}
                          </ActionButton>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
        {days.length === 0 && <p className="text-sm text-fg-muted">No classes scheduled in the next two weeks.</p>}
      </div>
    </>
  );
}
