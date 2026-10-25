"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getActiveSubscription, classesBookedThisWeek } from "@/lib/membership";
import { audit, notify } from "@/lib/activity";
import type { FormState } from "@/lib/validation";

export async function bookSessionAction(sessionId: string): Promise<FormState> {
  const user = await requireUser();
  const session = await db.classSession.findUnique({ where: { id: sessionId }, include: { gymClass: true, bookings: true } });
  if (!session || session.canceled) return { error: "This session is not available." };
  if (session.startsAt < new Date()) return { error: "This session has already started." };

  const sub = await getActiveSubscription(user.id);
  if (!sub) return { error: "You need an active membership to book classes." };
  if (sub.plan.maxClassesPerWeek != null) {
    const used = await classesBookedThisWeek(user.id, session.startsAt);
    if (used >= sub.plan.maxClassesPerWeek) return { error: `Your plan allows ${sub.plan.maxClassesPerWeek} classes per week. Upgrade to book more.` };
  }

  const existing = session.bookings.find((b) => b.userId === user.id);
  if (existing && existing.status !== "CANCELED") return { error: "You already booked this session." };

  const capacity = session.capacity ?? session.gymClass.capacity;
  const confirmed = session.bookings.filter((b) => b.status === "CONFIRMED" || b.status === "ATTENDED").length;
  const status = confirmed < capacity ? "CONFIRMED" : "WAITLISTED";

  const booking = await db.booking.upsert({
    where: { userId_sessionId: { userId: user.id, sessionId } },
    update: { status },
    create: { userId: user.id, sessionId, status },
  });
  await audit(user.id, "booking.create", "Booking", booking.id, { status });
  await notify(
    user.id,
    status === "CONFIRMED" ? "Class booked" : "Added to waitlist",
    `${session.gymClass.name} on ${session.startsAt.toLocaleString()}`,
    "/dashboard/bookings",
  );
  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/bookings");
  return { ok: true, message: status === "CONFIRMED" ? "You're booked in!" : "Class is full. You're on the waitlist and will be promoted automatically." };
}

export async function cancelBookingAction(bookingId: string): Promise<FormState> {
  const user = await requireUser();
  const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { session: { include: { gymClass: true } } } });
  if (!booking || booking.userId !== user.id) return { error: "Booking not found." };
  if (booking.status === "CANCELED") return { error: "Already canceled." };

  await db.booking.update({ where: { id: bookingId }, data: { status: "CANCELED" } });
  await audit(user.id, "booking.cancel", "Booking", bookingId);

  // Promote the first waitlisted member if a confirmed seat freed up.
  if (booking.status === "CONFIRMED") {
    const nextUp = await db.booking.findFirst({ where: { sessionId: booking.sessionId, status: "WAITLISTED" }, orderBy: { createdAt: "asc" } });
    if (nextUp) {
      await db.booking.update({ where: { id: nextUp.id }, data: { status: "CONFIRMED" } });
      await notify(nextUp.userId, "You're off the waitlist!", `A spot opened up in ${booking.session.gymClass.name}. You're confirmed.`, "/dashboard/bookings");
    }
  }
  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/bookings");
  return { ok: true, message: "Booking canceled." };
}
