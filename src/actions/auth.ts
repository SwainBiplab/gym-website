"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { randomBytes } from "crypto";
import { addHours } from "date-fns";
import { db } from "@/lib/db";
import { createSession, destroySession, generateMemberCode, hashPassword, verifyPassword, getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { sendMail, appUrl, layout } from "@/lib/mail";
import { audit, notifyAdmins } from "@/lib/activity";
import { registerSchema, loginSchema, emailSchema, passwordSchema, fieldErrors, type FormState } from "@/lib/validation";

async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

function safeNext(next: unknown) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export async function registerAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };

  const rl = rateLimit(`register:${await clientKey()}`, 10, 15 * 60_000);
  if (!rl.ok) return { error: "Too many sign-ups from this network. Try again later." };

  const { name, email, password, phone } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists.", fieldErrors: { email: ["Email already registered"] } };

  let memberCode = generateMemberCode();
  while (await db.user.findUnique({ where: { memberCode } })) memberCode = generateMemberCode();

  const user = await db.user.create({
    data: { name, email, passwordHash: await hashPassword(password), phone: phone || null, memberCode },
  });

  const token = randomBytes(32).toString("hex");
  await db.verificationToken.create({ data: { userId: user.id, token, type: "EMAIL_VERIFY", expiresAt: addHours(new Date(), 48) } });
  await sendMail({
    to: email,
    subject: "Verify your email",
    html: layout("Welcome aboard!", `<p>Hi ${name}, confirm your email to finish setting up your account.</p><p><a href="${appUrl(`/api/auth/verify?token=${token}`)}">Verify email</a></p>`),
    text: `Verify your email: ${appUrl(`/api/auth/verify?token=${token}`)}`,
  });

  await db.notification.create({
    data: { userId: user.id, title: "Welcome to the club", body: "Pick a membership plan to unlock classes and check-ins.", link: "/dashboard/membership" },
  });
  await notifyAdmins("New member signed up", `${name} (${email}) just created an account.`, `/admin/members/${user.id}`);
  await audit(user.id, "user.register", "User", user.id);

  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  redirect("/dashboard?welcome=1");
}

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Enter your email and password.", fieldErrors: fieldErrors(parsed.error) };
  const { email, password } = parsed.data;

  const rl = rateLimit(`login:${await clientKey()}:${email}`, 8, 10 * 60_000);
  if (!rl.ok) return { error: "Too many attempts. Please wait 10 minutes and try again." };

  const user = await db.user.findUnique({ where: { email } });
  const ok = user && (await verifyPassword(password, user.passwordHash));
  if (!ok) return { error: "Invalid email or password." };
  if (!user.active) return { error: "This account has been deactivated. Contact the front desk." };

  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  await audit(user.id, "user.login", "User", user.id);

  const next = safeNext(fd.get("next"));
  redirect(next ?? ((user.role === "ADMIN" || user.role === "SUPERADMIN") ? "/admin" : user.role === "TRAINER" ? "/trainer" : "/dashboard"));
}

export async function logoutAction() {
  const s = await getSession();
  if (s) await audit(s.id, "user.logout", "User", s.id);
  await destroySession();
  redirect("/login");
}

export async function forgotPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(fd.get("email"));
  if (!parsed.success) return { error: "Enter a valid email." };
  const rl = rateLimit(`forgot:${await clientKey()}`, 5, 15 * 60_000);
  if (!rl.ok) return { error: "Too many requests. Try again later." };

  const user = await db.user.findUnique({ where: { email: parsed.data } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    await db.verificationToken.create({ data: { userId: user.id, token, type: "PASSWORD_RESET", expiresAt: addHours(new Date(), 2) } });
    await sendMail({
      to: user.email,
      subject: "Reset your password",
      html: layout("Reset your password", `<p>Click below to choose a new password. The link expires in 2 hours.</p><p><a href="${appUrl(`/reset-password?token=${token}`)}">Reset password</a></p>`),
      text: `Reset your password: ${appUrl(`/reset-password?token=${token}`)}`,
    });
  }
  return { ok: true, message: "If that email exists, we've sent a reset link." };
}

export async function resetPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const token = String(fd.get("token") ?? "");
  const password = passwordSchema.safeParse(fd.get("password"));
  if (!password.success) return { error: password.error.issues[0].message };
  if (fd.get("password") !== fd.get("confirm")) return { error: "Passwords do not match." };

  const record = await db.verificationToken.findUnique({ where: { token } });
  if (!record || record.type !== "PASSWORD_RESET" || record.usedAt || record.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired." };
  }
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(password.data) } }),
    db.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  await audit(record.userId, "user.password_reset", "User", record.userId);
  return { ok: true, message: "Password updated. You can sign in now." };
}

export async function resendVerificationAction(): Promise<FormState> {
  const s = await getSession();
  if (!s) return { error: "Not signed in." };
  const user = await db.user.findUnique({ where: { id: s.id } });
  if (!user || user.emailVerifiedAt) return { ok: true, message: "Already verified." };
  const token = randomBytes(32).toString("hex");
  await db.verificationToken.create({ data: { userId: user.id, token, type: "EMAIL_VERIFY", expiresAt: addHours(new Date(), 48) } });
  await sendMail({
    to: user.email,
    subject: "Verify your email",
    html: layout("Verify your email", `<p><a href="${appUrl(`/api/auth/verify?token=${token}`)}">Verify email</a></p>`),
    text: `Verify: ${appUrl(`/api/auth/verify?token=${token}`)}`,
  });
  return { ok: true, message: "Verification email sent." };
}
