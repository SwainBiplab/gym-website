import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: emailSchema,
  password: passwordSchema,
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.string().max(20).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  emergencyContact: z.string().trim().max(120).optional().or(z.literal("")),
});

export const planSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  price: z.coerce.number().min(0).max(100000),
  currency: z.string().trim().length(3).default("usd"),
  interval: z.enum(["MONTH", "YEAR"]),
  intervalCount: z.coerce.number().int().min(1).max(36).default(1),
  trialDays: z.coerce.number().int().min(0).max(90).default(0),
  maxClassesPerWeek: z.coerce.number().int().min(0).max(100).optional(),
  features: z.string().max(2000).optional().or(z.literal("")),
  popular: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const gymClassSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  category: z.string().trim().max(40).default("General"),
  level: z.string().trim().max(40).default("All levels"),
  trainerId: z.string().optional().or(z.literal("")),
  capacity: z.coerce.number().int().min(1).max(500).default(20),
  durationMin: z.coerce.number().int().min(10).max(300).default(60),
  location: z.string().trim().max(60).default("Main floor"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#a3e635"),
});

export const progressSchema = z.object({
  date: z.string().min(1),
  weightKg: z.coerce.number().min(20).max(400).optional(),
  bodyFatPct: z.coerce.number().min(1).max(70).optional(),
  chestCm: z.coerce.number().min(30).max(200).optional(),
  waistCm: z.coerce.number().min(30).max(200).optional(),
  hipsCm: z.coerce.number().min(30).max(200).optional(),
  armsCm: z.coerce.number().min(10).max(100).optional(),
  thighsCm: z.coerce.number().min(20).max(120).optional(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const workoutSchema = z.object({
  date: z.string().min(1),
  title: z.string().trim().min(2).max(80),
  durationMin: z.coerce.number().int().min(1).max(600),
  calories: z.coerce.number().int().min(0).max(10000).optional(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(10).max(2000),
});

export type FormState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string[]>; message?: string } | undefined;

export function fieldErrors(err: z.ZodError) {
  return err.flatten().fieldErrors as Record<string, string[]>;
}

/** Turn an empty-string form value into undefined so optional numbers parse. */
export function cleanForm(fd: FormData) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v !== "string") continue;
    out[k] = v === "" ? undefined : v;
  }
  return out;
}
