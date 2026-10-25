import { addDays } from "date-fns";
import type { Prisma, BookingStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { SessionList } from "@/components/app/session-list";

export default async function TrainerClasses() {
  const user = await requireUser(["TRAINER", "ADMIN"]);
  const where = user.role === "TRAINER" ? { gymClass: { trainerId: user.id } } : {};
  const include = {
    gymClass: { include: { trainer: true } },
    _count: { select: { bookings: { where: { status: { in: ["CONFIRMED", "ATTENDED"] as BookingStatus[] } } } } },
  } satisfies Prisma.ClassSessionInclude;
  const [upcoming, past] = await Promise.all([
    db.classSession.findMany({ where: { ...where, startsAt: { gte: new Date(), lt: addDays(new Date(), 21) } }, include, orderBy: { startsAt: "asc" } }),
    db.classSession.findMany({ where: { ...where, startsAt: { lt: new Date() } }, include, orderBy: { startsAt: "desc" }, take: 20 }),
  ]);
  return (
    <>
      <PageHeader eyebrow="Schedule" title="My classes" description="Upcoming sessions for the next three weeks, plus recent history." />
      <Card className="mb-6">
        <CardHeader title="Upcoming" />
        <SessionList sessions={upcoming} hrefBase="/trainer/sessions" />
      </Card>
      <Card>
        <CardHeader title="Recent" />
        <SessionList sessions={past} hrefBase="/trainer/sessions" />
      </Card>
    </>
  );
}
