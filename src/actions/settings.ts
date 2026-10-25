"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/activity";
import { isAllowedMediaUrl, localMediaName, UPLOAD_DIR } from "@/lib/media";
import { unlink } from "node:fs/promises";
import path from "node:path";
import type { FormState } from "@/lib/validation";

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(60),
  tagline: z.string().trim().max(120).optional().or(z.literal("")),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #E5B93C"),
  heroTitle: z.string().trim().min(4).max(120),
  heroSubtitle: z.string().trim().min(4).max(300),
  address: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  hours: z.string().trim().max(120).optional().or(z.literal("")),
  instagram: z.string().trim().max(60).optional().or(z.literal("")),
  facebook: z.string().trim().max(120).optional().or(z.literal("")),
  heroVideo: z.string().trim().max(300).optional().or(z.literal("")),
  showcaseVideo: z.string().trim().max(300).optional().or(z.literal("")),
});

const MAX_LOGO_BYTES = 400 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export async function updateSettingsAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const actor = await requireUser(["SUPERADMIN"]);
  const parsed = schema.safeParse(Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };

  let logoDataUrl: string | null | undefined = undefined;
  const logo = fd.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (!LOGO_TYPES.includes(logo.type)) return { error: "Logo must be PNG, JPG, WebP or SVG.", fieldErrors: { logo: ["Unsupported file type"] } };
    if (logo.size > MAX_LOGO_BYTES) return { error: "Logo must be under 400 KB.", fieldErrors: { logo: ["File too large"] } };
    const buf = Buffer.from(await logo.arrayBuffer());
    logoDataUrl = `data:${logo.type};base64,${buf.toString("base64")}`;
  }
  if (fd.get("removeLogo") === "on") logoDataUrl = null;

  const d = parsed.data;
  for (const [field, v] of [["heroVideo", d.heroVideo], ["showcaseVideo", d.showcaseVideo]] as const) {
    if (v && !isAllowedMediaUrl(v)) return { error: "Video links must be https:// URLs or an uploaded file.", fieldErrors: { [field]: ["Use an https:// link or upload an MP4/WebM"] } };
  }
  const previous = await db.siteSettings.findUnique({ where: { id: "default" } });
  const data = {
    name: d.name,
    tagline: d.tagline || null,
    accentColor: d.accentColor,
    heroTitle: d.heroTitle,
    heroSubtitle: d.heroSubtitle,
    address: d.address || null,
    phone: d.phone || null,
    email: d.email || null,
    hours: d.hours || null,
    instagram: d.instagram || null,
    facebook: d.facebook || null,
    heroVideo: d.heroVideo || null,
    showcaseVideo: d.showcaseVideo || null,
    ...(logoDataUrl !== undefined ? { logoDataUrl } : {}),
  };
  await db.siteSettings.upsert({ where: { id: "default" }, update: data, create: { id: "default", ...data } });
  // Remove uploaded files that are no longer referenced.
  for (const [old, next] of [[previous?.heroVideo, d.heroVideo], [previous?.showcaseVideo, d.showcaseVideo]] as const) {
    const name = localMediaName(old);
    if (name && old !== (next || null) && name !== localMediaName(d.heroVideo) && name !== localMediaName(d.showcaseVideo)) await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
  }
  await audit(actor.id, "settings.update", "SiteSettings", "default", { name: d.name, accentColor: d.accentColor, logo: logoDataUrl === undefined ? "unchanged" : logoDataUrl ? "uploaded" : "removed" });
  revalidatePath("/", "layout");
  return { ok: true, message: "Branding saved. Changes are live everywhere." };
}
