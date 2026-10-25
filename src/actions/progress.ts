"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { progressSchema, workoutSchema, fieldErrors, cleanForm, type FormState } from "@/lib/validation";

export async function addProgressAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = progressSchema.safeParse(cleanForm(fd));
  if (!parsed.success) return { error: "Check the values you entered.", fieldErrors: fieldErrors(parsed.error) };
  const { date, notes, ...metrics } = parsed.data;
  if (Object.values(metrics).every((v) => v == null)) return { error: "Enter at least one measurement." };
  await db.progressLog.create({ data: { userId: user.id, date: new Date(date), notes: notes || null, ...metrics } });
  revalidatePath("/dashboard/progress");
  return { ok: true, message: "Measurement logged." };
}

export async function deleteProgressAction(id: string) {
  const user = await requireUser();
  await db.progressLog.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard/progress");
}

export async function addWorkoutAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = workoutSchema.safeParse(cleanForm(fd));
  if (!parsed.success) return { error: "Check the values you entered.", fieldErrors: fieldErrors(parsed.error) };
  const { date, title, durationMin, calories, notes } = parsed.data;
  await db.workoutLog.create({ data: { userId: user.id, date: new Date(date), title, durationMin, calories: calories ?? null, notes: notes || null } });
  revalidatePath("/dashboard/progress");
  return { ok: true, message: "Workout logged." };
}

export async function deleteWorkoutAction(id: string) {
  const user = await requireUser();
  await db.workoutLog.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard/progress");
}
