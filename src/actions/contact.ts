"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import { notifyAdmins } from "@/lib/activity";
import { contactSchema, fieldErrors, type FormState } from "@/lib/validation";

export async function contactAction(_prev: FormState, fd: FormData): Promise<FormState> {
  if (fd.get("website")) return { ok: true, message: "Thanks! We'll be in touch." }; // honeypot
  const parsed = contactSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60_000).ok) return { error: "Too many messages. Try again later." };
  await db.contactMessage.create({ data: parsed.data });
  await notifyAdmins("New contact message", `${parsed.data.name}: ${parsed.data.subject}`, `/admin/inbox`);
  return { ok: true, message: "Thanks! We'll get back to you within one business day." };
}
