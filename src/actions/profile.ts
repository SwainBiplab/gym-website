"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, hashPassword, verifyPassword, createSession } from "@/lib/auth";
import { audit } from "@/lib/activity";
import { profileSchema, passwordSchema, fieldErrors, type FormState } from "@/lib/validation";

export async function updateProfileAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  await db.user.update({
    where: { id: user.id },
    data: {
      name: d.name,
      phone: d.phone || null,
      gender: d.gender || null,
      address: d.address || null,
      emergencyContact: d.emergencyContact || null,
      dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : null,
    },
  });
  await createSession({ id: user.id, email: user.email, name: d.name, role: user.role });
  await audit(user.id, "user.update_profile", "User", user.id);
  revalidatePath("/dashboard/profile");
  return { ok: true, message: "Profile saved." };
}

export async function changePasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = passwordSchema.safeParse(fd.get("password"));
  if (!next.success) return { error: next.error.issues[0].message };
  if (fd.get("password") !== fd.get("confirm")) return { error: "New passwords do not match." };
  if (!(await verifyPassword(current, user.passwordHash))) return { error: "Current password is incorrect." };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next.data) } });
  await audit(user.id, "user.change_password", "User", user.id);
  return { ok: true, message: "Password changed." };
}
