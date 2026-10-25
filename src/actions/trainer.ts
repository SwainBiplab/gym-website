"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/activity";
import type { FormState } from "@/lib/validation";

export async function markAttendanceAction(bookingId: string, status: "ATTENDED" | "NO_SHOW" | "CONFIRMED"): Promise<FormState> {
  const user = await requireUser(["TRAINER", "ADMIN"]);
  const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { session: { include: { gymClass: true } } } });
  if (!booking) return { error: "Booking not found." };
  if (user.role === "TRAINER" && booking.session.gymClass.trainerId !== user.id) return { error: "Not your class." };
  await db.booking.update({ where: { id: bookingId }, data: { status } });
  if (status === "ATTENDED") {
    const already = await db.checkIn.findFirst({
      where: { userId: booking.userId, checkedInAt: { gte: new Date(booking.session.startsAt.getTime() - 2 * 3600_000), lte: booking.session.endsAt } },
    });
    if (!already) await db.checkIn.create({ data: { userId: booking.userId, method: "CLASS", staffId: user.id, checkedInAt: booking.session.startsAt } });
  }
  await audit(user.id, "booking.attendance", "Booking", bookingId, { status });
  revalidatePath("/trainer");
  revalidatePath("/admin/classes");
  return { ok: true };
}

export async function updateTrainerProfileAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser(["TRAINER", "ADMIN"]);
  const bio = String(fd.get("bio") ?? "").slice(0, 1000);
  const specialties = String(fd.get("specialties") ?? "").slice(0, 300);
  const instagram = String(fd.get("instagram") ?? "").slice(0, 80);
  const yearsExperience = Math.max(0, Math.min(60, Number(fd.get("yearsExperience") || 0)));
  await db.trainerProfile.upsert({
    where: { userId: user.id },
    update: { bio, specialties, instagram, yearsExperience },
    create: { userId: user.id, bio, specialties, instagram, yearsExperience },
  });
  revalidatePath("/trainer/profile");
  revalidatePath("/trainers");
  return { ok: true, message: "Profile updated." };
}
