import Link from "next/link";
import type { Metadata } from "next";
import { addDays, addWeeks, endOfWeek, format, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { fmtTime, sameDay } from "@/lib/utils";
import { PageHeader } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Class schedule" };

export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { week } = await searchParams;
  const offset = Math.max(-8, Math.min(8, Number(week ?? 0) || 0));
  const session = await getSession();
  const start = startOfWeek(addWeeks(new Date(), offset), { weekStartsOn: 1 });
  const end = endOfWeek(start, { weekStartsOn: 1 });
  const sessions = await db.classSession.findMany({
    where: { startsAt: { gte: start, lte: end }, canceled: false, gymClass: { active: true } },
    include: { gymClass: { include: { trainer: true } }, _count: { select: { bookings: { where: { status: { in: ["CONFIRMED", "ATTENDED"] } } } } } },
    orderBy: { startsAt: "asc" },
  });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const categories = Array.from(new Set(sessions.map((s) => s.gymClass.category)));

  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="Weekly classes"
        description="Members book directly from their dashboard. Spots are live — waitlists promote automatically."
        action={
          <div className="glass glass-pill flex items-center gap-1 p-1">
            <Link href={`/classes?week=${offset - 1}`} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Previous week">
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="px-3 text-sm">
              {format(start, "MMM d")} – {format(end, "MMM d")}
            </span>
            <Link href={`/classes?week=${offset + 1}`} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Next week">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        }
      />
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Badge key={c} tone="neutral">{c}</Badge>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-7 md:grid-cols-2">
        {days.map((d) => {
          const todays = sessions.filter((s) => sameDay(s.startsAt, d));
          const isToday = sameDay(d, new Date());
          return (
            <div key={d.toISOString()} className={`glass glass-sm p-3 ${isToday ? "glass-strong ring-1 ring-accent-2/40" : ""}`}>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-fg-muted">
                {format(d, "EEE")} <span className="text-fg">{format(d, "d")}</span>
              </p>
              {todays.length === 0 ? (
                <p className="text-xs text-fg-subtle">Rest day</p>
              ) : (
                <ul className="space-y-2">
                  {todays.map((s) => {
                    const cap = s.capacity ?? s.gymClass.capacity;
                    const left = cap - s._count.bookings;
                    return (
                      <li key={s.id} className="rounded-2xl border border-white/8 bg-white/4 p-2.5">
                        <span className="mb-1 block h-1 w-8 rounded-full" style={{ background: s.gymClass.color }} />
                        <p className="text-sm font-medium leading-tight">{s.gymClass.name}</p>
                        <p className="text-xs text-fg-muted">{fmtTime(s.startsAt)} · {s.gymClass.durationMin} min</p>
                        <p className="text-xs text-fg-subtle">{s.gymClass.trainer?.name ?? "Staff"}</p>
                        <p className={`mt-1 text-[11px] ${left <= 0 ? "text-accent-3" : left <= 3 ? "text-amber-300" : "text-accent-2"}`}>
                          {left <= 0 ? "Full · waitlist" : `${left} spots left`}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-10 text-center">
        <Link href={session ? "/dashboard/classes" : "/register"} className={buttonClass("primary", "lg")}>
          {session ? "Book a class" : "Join to book classes"}
        </Link>
      </div>
    </>
  );
}
