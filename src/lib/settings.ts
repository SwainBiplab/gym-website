import "server-only";
import { cache } from "react";
import type { SiteSettings } from "@prisma/client";
import { db } from "./db";

export const DEFAULT_SETTINGS: SiteSettings = {
  id: "default",
  name: process.env.NEXT_PUBLIC_GYM_NAME || "Your Gym",
  tagline: null,
  logoDataUrl: null,
  heroVideo: null,
  showcaseVideo: null,
  accentColor: "#E5B93C",
  heroTitle: "Train in a space built around you.",
  heroSubtitle: "Memberships, class booking, QR check-in and progress tracking in one place. Start with a free trial.",
  address: null,
  phone: null,
  email: null,
  hours: "Open daily 5:00 – 23:00",
  instagram: null,
  facebook: null,
  updatedAt: new Date(0),
};

/** Site branding and contact settings (single row). Cached per request. */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const row = await db.siteSettings.findUnique({ where: { id: "default" } });
    return row ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
});
