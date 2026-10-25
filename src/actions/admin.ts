"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays, addWeeks, setHours, setMinutes, startOfDay } from "date-fns";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser, hashPassword, generateMemberCode } from "@/lib/auth";
import { audit, notify } from "@/lib/activity";
import { periodEnd, getActiveSubscription } from "@/lib/membership";
import { slugify } from "@/lib/utils";
import { planSchema, gymClassSchema, registerSchema, fieldErrors, cleanForm, type FormState } from "@/lib/validation";

const admin = () => requireUser(["ADMIN"]);

/* ---------------- Members ---------------- */

export async function createMemberAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const actor = await admin();
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const role = (["MEMBER", "TRAINER", "ADMIN"].includes(String(fd.get("role"))) ? String(fd.get("role")) : "MEMBER") as Role;
  if (await db.user.findUnique({ where: { email: parsed.data.email } })) return { error: "Email already registered." };
  let memberCode = generateMemberCode();
  while (await db.user.findUnique({ where: { memberCode } })) memberCode = generateMemberCode();
  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      passwordHash: await hashPassword(parsed.data.password),
      role,
      memberCode,
      emailVerifiedAt: new Date(),
      ...(role === "TRAINER" ? { trainerProfile: { create: {} } } : {}),
    },
  });
  await audit(actor.id, "admin.member.create", "User", user.id, { role });
  revalidatePath("/admin/members");
  redirect(`/admin/members/${user.id}`);
}

export async function updateMemberAction(userId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const actor = await admin();
  const name = String(fd.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Name is too short." };
  const role = String(fd.get("role")) as Role;
  if (!["MEMBER", "TRAINER", "ADMIN"].includes(role)) return { error: "Invalid role." };
  if (userId === actor.id && role !== "ADMIN") return { error: "You cannot remove your own admin role." };
  const target = await db.user.findUnique({ where: { id: userId }, include: { trainerProfile: true } });
  if (!target) return { error: "Member not found." };
  await db.user.update({
    where: { id: userId },
    data: {
      name,
      role,
      phone: String(fd.get("phone") ?? "") || null,
      notes: String(fd.get("notes") ?? "") || null,
      address: String(fd.get("address") ?? "") || null,
      emergencyContact: String(fd.get("emergencyContact") ?? "") || null,
      active: fd.get("active") === "on",
      ...(role === "TRAINER" && !target.trainerProfile ? { trainerProfile: { create: {} } } : {}),
    },
  });
  await audit(actor.id, "admin.member.update", "User", userId, { role });
  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/members");
  return { ok: true, message: "Member updated." };
}

export async function adminSetPasswordAction(userId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const actor = await admin();
  const pw = String(fd.get("password") ?? "");
  if (pw.length < 8) return { error: "Password must be at least 8 characters." };
  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(pw) } });
  await audit(actor.id, "admin.member.set_password", "User", userId);
  return { ok: true, message: "Password updated." };
}

export async function deleteMemberAction(userId: string) {
  const actor = await admin();
  if (userId === actor.id) return;
  await db.user.delete({ where: { id: userId } });
  await audit(actor.id, "admin.member.delete", "User", userId);
  revalidatePath("/admin/members");
  redirect("/admin/members");
}

/* ---------------- Subscriptions & payments ---------------- */

export async function adminAssignPlanAction(userId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const actor = await admin();
  const plan = await db.plan.findUnique({ where: { id: String(fd.get("planId")) } });
  if (!plan) return { error: "Choose a plan." };
  const start = fd.get("startDate") ? new Date(String(fd.get("startDate"))) : new Date();
  const end = periodEnd(start, plan.interval, plan.intervalCount);
  const paid = fd.get("paid") === "on";
  const method = String(fd.get("method") || "CASH");

  const current = await getActiveSubscription(userId);
  await db.$transaction(async (tx) => {
    if (current) await tx.subscription.update({ where: { id: current.id }, data: { status: "CANCELED", canceledAt: new Date() } });
    const sub = await tx.subscription.create({
      data: { userId, planId: plan.id, status: "ACTIVE", source: "OFFLINE", startDate: start, currentPeriodStart: start, currentPeriodEnd: end },
    });
    await tx.payment.create({
      data: {
        userId,
        subscriptionId: sub.id,
        amountCents: plan.priceCents,
        currency: plan.currency,
        status: paid ? "PAID" : "PENDING",
        method,
        paidAt: paid ? new Date() : null,
        description: `${plan.name} membership (assigned by staff)`,
      },
    });
  });
  await notify(userId, "Membership updated", `Your ${plan.name} membership is active until ${end.toDateString()}.`, "/dashboard/membership");
  await audit(actor.id, "admin.subscription.assign", "User", userId, { planId: plan.id, paid });
  revalidatePath(`/admin/members/${userId}`);
  return { ok: true, message: `${plan.name} assigned.` };
}

export async function adminExtendSubscriptionAction(subscriptionId: string, days: number) {
  const actor = await admin();
  const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) return;
  await db.subscription.update({
    where: { id: subscriptionId },
    data: { currentPeriodEnd: addDays(sub.currentPeriodEnd, days), status: sub.status === "EXPIRED" ? "ACTIVE" : sub.status },
  });
  await audit(actor.id, "admin.subscription.extend", "Subscription", subscriptionId, { days });
  revalidatePath(`/admin/members/${sub.userId}`);
}

export async function adminCancelSubscriptionAction(subscriptionId: string) {
  const actor = await admin();
  const sub = await db.subscription.update({ where: { id: subscriptionId }, data: { status: "CANCELED", canceledAt: new Date() } });
  await audit(actor.id, "admin.subscription.cancel", "Subscription", subscriptionId);
  await notify(sub.userId, "Membership canceled", "Your membership was canceled by staff. Contact the front desk with questions.", "/dashboard/membership");
  revalidatePath(`/admin/members/${sub.userId}`);
  revalidatePath("/admin/subscriptions");
}

export async function markPaymentPaidAction(paymentId: string) {
  const actor = await admin();
  const p = await db.payment.update({ where: { id: paymentId }, data: { status: "PAID", paidAt: new Date() } });
  await audit(actor.id, "admin.payment.paid", "Payment", paymentId);
  await notify(p.userId, "Payment received", `We recorded your payment of ${(p.amountCents / 100).toFixed(2)} ${p.currency.toUpperCase()}. Thank you!`, "/dashboard/invoices");
  revalidatePath(`/admin/members/${p.userId}`);
  revalidatePath("/admin/payments");
}

export async function recordPaymentAction(userId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const actor = await admin();
  const amount = Number(fd.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };
  const p = await db.payment.create({
    data: {
      userId,
      amountCents: Math.round(amount * 100),
      currency: String(fd.get("currency") || "usd").toLowerCase(),
      method: String(fd.get("method") || "CASH"),
      status: "PAID",
      paidAt: new Date(),
      description: String(fd.get("description") || "Front desk payment"),
    },
  });
  await audit(actor.id, "admin.payment.record", "Payment", p.id);
  revalidatePath(`/admin/members/${userId}`);
  return { ok: true, message: "Payment recorded." };
}

/* ---------------- Plans ---------------- */

export async function upsertPlanAction(planId: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const actor = await admin();
  const raw = cleanForm(fd);
  const parsed = planSchema.safeParse({ ...raw, popular: fd.get("popular") === "on", active: fd.get("active") === "on" });
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const features = JSON.stringify(
    (d.features || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const data = {
    name: d.name,
    description: d.description || null,
    priceCents: Math.round(d.price * 100),
    currency: d.currency.toLowerCase(),
    interval: d.interval,
    intervalCount: d.intervalCount,
    trialDays: d.trialDays,
    maxClassesPerWeek: d.maxClassesPerWeek && d.maxClassesPerWeek > 0 ? d.maxClassesPerWeek : null,
    features,
    popular: d.popular,
    active: d.active,
    sortOrder: d.sortOrder,
  };
  if (planId) {
    await db.plan.update({ where: { id: planId }, data });
  } else {
    let slug = slugify(d.name);
    while (await db.plan.findUnique({ where: { slug } })) slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    await db.plan.create({ data: { ...data, slug } });
  }
  await audit(actor.id, planId ? "admin.plan.update" : "admin.plan.create", "Plan", planId);
  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  revalidatePath("/dashboard/membership");
  return { ok: true, message: "Plan saved." };
}

export async function deletePlanAction(planId: string) {
  const actor = await admin();
  const count = await db.subscription.count({ where: { planId } });
  if (count > 0) {
    await db.plan.update({ where: { id: planId }, data: { active: false } });
  } else {
    await db.plan.delete({ where: { id: planId } });
  }
  await audit(actor.id, "admin.plan.delete", "Plan", planId);
  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
}

/* ---------------- Classes & sessions ---------------- */

export async function upsertClassAction(classId: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const actor = await admin();
  const parsed = gymClassSchema.safeParse(cleanForm(fd));
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const data = { ...d, description: d.description || null, trainerId: d.trainerId || null };
  const saved = classId ? await db.gymClass.update({ where: { id: classId }, data }) : await db.gymClass.create({ data });
  await audit(actor.id, classId ? "admin.class.update" : "admin.class.create", "GymClass", saved.id);
  revalidatePath("/admin/classes");
  revalidatePath("/classes");
  if (!classId) redirect(`/admin/classes/${saved.id}`);
  return { ok: true, message: "Class saved." };
}

export async function deleteClassAction(classId: string) {
  const actor = await admin();
  await db.gymClass.delete({ where: { id: classId } });
  await audit(actor.id, "admin.class.delete", "GymClass", classId);
  revalidatePath("/admin/classes");
  redirect("/admin/classes");
}

/** Create one session or a weekly recurring series (same weekday/time for N weeks). */
export async function createSessionsAction(classId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const actor = await admin();
  const gymClass = await db.gymClass.findUnique({ where: { id: classId } });
  if (!gymClass) return { error: "Class not found." };
  const date = String(fd.get("date") ?? "");
  const time = String(fd.get("time") ?? "");
  const weeks = Math.max(1, Math.min(52, Number(fd.get("weeks") || 1)));
  const capacity = fd.get("capacity") ? Number(fd.get("capacity")) : null;
  if (!date || !time) return { error: "Choose a date and time." };
  const [h, m] = time.split(":").map(Number);
  const first = setMinutes(setHours(startOfDay(new Date(date)), h), m);
  if (Number.isNaN(first.getTime())) return { error: "Invalid date." };

  const rows = Array.from({ length: weeks }, (_, i) => {
    const startsAt = addWeeks(first, i);
    return { classId, startsAt, endsAt: new Date(startsAt.getTime() + gymClass.durationMin * 60_000), capacity, notes: String(fd.get("notes") || "") || null };
  });
  await db.classSession.createMany({ data: rows });
  await audit(actor.id, "admin.session.create", "GymClass", classId, { count: rows.length });
  revalidatePath(`/admin/classes/${classId}`);
  revalidatePath("/classes");
  revalidatePath("/dashboard/classes");
  return { ok: true, message: `${rows.length} session${rows.length > 1 ? "s" : ""} scheduled.` };
}

export async function cancelSessionAction(sessionId: string) {
  const actor = await admin();
  const session = await db.classSession.update({ where: { id: sessionId }, data: { canceled: true }, include: { gymClass: true, bookings: { where: { status: { in: ["CONFIRMED", "WAITLISTED"] } } } } });
  if (session.bookings.length) {
    await db.notification.createMany({
      data: session.bookings.map((b) => ({
        userId: b.userId,
        title: "Class canceled",
        body: `${session.gymClass.name} on ${session.startsAt.toLocaleString()} was canceled.`,
        link: "/dashboard/bookings",
      })),
    });
    await db.booking.updateMany({ where: { sessionId }, data: { status: "CANCELED" } });
  }
  await audit(actor.id, "admin.session.cancel", "ClassSession", sessionId);
  revalidatePath(`/admin/classes/${session.classId}`);
  revalidatePath("/dashboard/classes");
}

export async function deleteSessionAction(sessionId: string) {
  const actor = await admin();
  const s = await db.classSession.delete({ where: { id: sessionId } });
  await audit(actor.id, "admin.session.delete", "ClassSession", sessionId);
  revalidatePath(`/admin/classes/${s.classId}`);
}

/* ---------------- Check-in ---------------- */

export async function checkInByCodeAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const staff = await requireUser(["ADMIN", "TRAINER"]);
  const code = String(fd.get("code") ?? "").trim().toUpperCase();
  if (!code) return { error: "Scan or type a member code." };
  const member = await db.user.findFirst({ where: { OR: [{ memberCode: code }, { email: code.toLowerCase() }] } });
  if (!member) return { error: `No member found for "${code}".` };
  if (!member.active) return { error: `${member.name}'s account is deactivated.` };
  const sub = await getActiveSubscription(member.id);
  const open = await db.checkIn.findFirst({ where: { userId: member.id, checkedOutAt: null, checkedInAt: { gte: addDays(new Date(), -1) } } });
  if (open) {
    await db.checkIn.update({ where: { id: open.id }, data: { checkedOutAt: new Date() } });
    revalidatePath("/admin/checkin");
    return { ok: true, message: `${member.name} checked out. See you next time!` };
  }
  await db.checkIn.create({ data: { userId: member.id, method: fd.get("method") === "QR" ? "QR" : "CODE", staffId: staff.id } });
  await audit(staff.id, "checkin.create", "User", member.id);
  revalidatePath("/admin/checkin");
  if (!sub) return { ok: true, error: `${member.name} checked in, but has NO active membership.` };
  if (sub.status === "PAST_DUE") return { ok: true, error: `${member.name} checked in. Membership is past due — please collect payment.` };
  return { ok: true, message: `Welcome, ${member.name}! ${sub.plan.name} · valid until ${sub.currentPeriodEnd.toDateString()}.` };
}

/* ---------------- Announcements & inbox ---------------- */

export async function createAnnouncementAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const actor = await admin();
  const title = String(fd.get("title") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  if (title.length < 3 || body.length < 3) return { error: "Title and body are required." };
  const a = await db.announcement.create({ data: { title, body, pinned: fd.get("pinned") === "on", authorId: actor.id } });
  if (fd.get("notifyAll") === "on") {
    const members = await db.user.findMany({ where: { active: true }, select: { id: true } });
    await db.notification.createMany({ data: members.map((m) => ({ userId: m.id, title, body: body.slice(0, 200), link: "/dashboard" })) });
  }
  await audit(actor.id, "admin.announcement.create", "Announcement", a.id);
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
  return { ok: true, message: "Announcement published." };
}

export async function deleteAnnouncementAction(id: string) {
  const actor = await admin();
  await db.announcement.delete({ where: { id } });
  await audit(actor.id, "admin.announcement.delete", "Announcement", id);
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
}

export async function toggleAnnouncementPinAction(id: string) {
  await admin();
  const a = await db.announcement.findUnique({ where: { id } });
  if (!a) return;
  await db.announcement.update({ where: { id }, data: { pinned: !a.pinned } });
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
}

export async function markContactHandledAction(id: string) {
  await admin();
  await db.contactMessage.update({ where: { id }, data: { handled: true } });
  revalidatePath("/admin/inbox");
}

export async function updateTrainerProfileAdminAction(userId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const actor = await admin();
  await db.trainerProfile.upsert({
    where: { userId },
    update: {
      bio: String(fd.get("bio") ?? ""),
      specialties: String(fd.get("specialties") ?? ""),
      instagram: String(fd.get("instagram") ?? ""),
      yearsExperience: Number(fd.get("yearsExperience") || 0),
      featured: fd.get("featured") === "on",
    },
    create: {
      userId,
      bio: String(fd.get("bio") ?? ""),
      specialties: String(fd.get("specialties") ?? ""),
      instagram: String(fd.get("instagram") ?? ""),
      yearsExperience: Number(fd.get("yearsExperience") || 0),
      featured: fd.get("featured") === "on",
    },
  });
  await audit(actor.id, "admin.trainer.update", "TrainerProfile", userId);
  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/trainers");
  return { ok: true, message: "Trainer profile saved." };
}
