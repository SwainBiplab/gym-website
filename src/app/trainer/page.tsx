import { addDays, startOfDay, startOfWeek, endOfWeek } from "date-fns";
import { Users, CalendarDays, Star } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { SessionList } from "@/components/app/session-list";

export default async function TrainerHome() {
  const user = await requireUser(["TRAINER", "ADMIN"]);
  const now = new Date();
  const where = user.role === "TRAINER" ? { gymClass: { trainerId: user.id } } : {};
  const [today, week, attendedMonth, classCount] = await Promise.all([
    db.classSession.findMany({
      where: { ...where, startsAt: { gte: startOfDay(now), lt: addDays(startOfDay(now), 1) } },
      include: { gymClass: { include: { trainer: true } }, _count: { select: { bookings: { where: { status: { in: ["CONFIRMED", "ATTENDED"] } } } } } },
      orderBy: { startsAt: "asc" },
    }),
    db.classSession.count({ where: { ...where, startsAt: { gte: startOfWeek(now, { weekStartsOn: 1 }), lte: endOfWeek(now, { weekStartsOn: 1 }) }, canceled: false } }),
    db.booking.count({ where: { status: "ATTENDED", session: { ...where, startsAt: { gte: addDays(now, -30) } } } }),
    db.gymClass.count({ where: user.role === "TRAINER" ? { trainerId: user.id, active: true } : { active: true } }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Coach" title={`Good to see you, ${user.name.split(" ")[0]}`} description="Today's sessions and attendance at a glance." />
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Sessions this week" value={week} icon={<CalendarDays className="h-4 w-4" />} />
        <Stat label="Attendees (30 days)" value={attendedMonth} icon={<Users className="h-4 w-4" />} tone="accent-2" />
        <Stat label="Class formats" value={classCount} icon={<Star className="h-4 w-4" />} tone="accent-3" />
      </div>
      <Card className="mt-6">
        <CardHeader title="Today" description="Tap a session to take attendance." />
        <SessionList sessions={today} hrefBase="/trainer/sessions" empty="No sessions today. Enjoy the rest day." />
      </Card>
    </>
  );
}
