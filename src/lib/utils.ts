import { format, formatDistanceToNow, isSameDay } from "date-fns";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function money(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

export function fmtDate(d: Date | string | null | undefined, pattern = "MMM d, yyyy") {
  if (!d) return "—";
  return format(new Date(d), pattern);
}

export function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return format(new Date(d), "EEE, MMM d · h:mm a");
}

export function fmtTime(d: Date | string) {
  return format(new Date(d), "h:mm a");
}

export function ago(d: Date | string) {
  return formatDistanceToNow(new Date(d), { addSuffix: true });
}

export function sameDay(a: Date, b: Date) {
  return isSameDay(a, b);
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function parseFeatures(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function intervalLabel(interval: "MONTH" | "YEAR", count = 1) {
  if (interval === "YEAR") return count === 1 ? "year" : `${count} years`;
  return count === 1 ? "month" : `${count} months`;
}

export const APP_NAME = process.env.NEXT_PUBLIC_GYM_NAME || "Your Gym";
