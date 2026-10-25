import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, addMonths, addWeeks, setHours, setMinutes, startOfDay, startOfWeek, subDays, subMonths } from "date-fns";

const db = new PrismaClient();
const PASSWORD = "Password123";

const code = (n: number) => `IP-${100000 + n}`;

async function main() {
  console.log("Seeding…");
  await db.$transaction([
    db.auditLog.deleteMany(),
    db.notification.deleteMany(),
    db.booking.deleteMany(),
    db.classSession.deleteMany(),
    db.gymClass.deleteMany(),
    db.checkIn.deleteMany(),
    db.payment.deleteMany(),
    db.subscription.deleteMany(),
    db.plan.deleteMany(),
    db.progressLog.deleteMany(),
    db.workoutLog.deleteMany(),
    db.announcement.deleteMany(),
    db.contactMessage.deleteMany(),
    db.verificationToken.deleteMany(),
    db.trainerProfile.deleteMany(),
    db.user.deleteMany(),
    db.siteSettings.deleteMany(),
  ]);

  const hash = await bcrypt.hash(PASSWORD, 10);

  await db.siteSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "IronPulse Fitness",
      tagline: "Strength. Community. Progress.",
      accentColor: "#E5B93C",
      address: "42 Momentum Ave, Springfield",
      phone: "+1 (555) 010-0100",
      email: "hello@ironpulse.fit",
      hours: "Open daily 5:00 – 23:00",
      instagram: "ironpulse.fit",
    },
  });

  const admin = await db.user.create({
    data: { name: "Alex Owner", email: "admin@gym.test", passwordHash: hash, role: "SUPERADMIN", memberCode: code(1), emailVerifiedAt: new Date(), phone: "+1 555 0100" },
  });
  await db.user.create({
    data: { name: "Sasha Staff", email: "staff@gym.test", passwordHash: hash, role: "ADMIN", memberCode: code(2), emailVerifiedAt: new Date(), phone: "+1 555 0101" },
  });

  const trainersData = [
    { name: "Maya Torres", email: "maya@gym.test", bio: "Strength & conditioning coach, former national-level powerlifter. I keep it simple: progressive overload, good food, great sleep.", specialties: "Strength, Powerlifting, Mobility", years: 9, featured: true },
    { name: "Jordan Lee", email: "jordan@gym.test", bio: "HIIT and endurance specialist. Expect sweat, loud music and a lot of high-fives.", specialties: "HIIT, Running, Conditioning", years: 6, featured: true },
    { name: "Priya Nair", email: "priya@gym.test", bio: "Yoga and Pilates instructor focused on breath, balance and injury-proof movement.", specialties: "Yoga, Pilates, Recovery", years: 11, featured: true },
    { name: "Sam Okafor", email: "sam@gym.test", bio: "Boxing coach and functional training nerd.", specialties: "Boxing, Functional, Core", years: 7, featured: false },
  ];
  const trainers = [];
  for (const [i, t] of trainersData.entries()) {
    trainers.push(
      await db.user.create({
        data: {
          name: t.name,
          email: t.email,
          passwordHash: hash,
          role: "TRAINER",
          memberCode: code(10 + i),
          emailVerifiedAt: new Date(),
          trainerProfile: { create: { bio: t.bio, specialties: t.specialties, yearsExperience: t.years, featured: t.featured, instagram: t.name.split(" ")[0].toLowerCase() + ".fit" } },
        },
      }),
    );
  }

  const plans = await Promise.all([
    db.plan.create({
      data: {
        name: "Basic", slug: "basic", description: "Gym floor access during off-peak hours.", priceCents: 2900, interval: "MONTH", trialDays: 7, sortOrder: 1, maxClassesPerWeek: 2,
        features: JSON.stringify(["Gym floor access (6am–4pm)", "2 group classes / week", "Locker room & showers", "Mobile check-in"]),
      },
    }),
    db.plan.create({
      data: {
        name: "Pro", slug: "pro", description: "Unlimited access and unlimited classes.", priceCents: 4900, interval: "MONTH", trialDays: 7, sortOrder: 2, popular: true,
        features: JSON.stringify(["24/7 gym access", "Unlimited group classes", "Progress tracking & body metrics", "1 guest pass / month", "Sauna & recovery zone"]),
      },
    }),
    db.plan.create({
      data: {
        name: "Elite", slug: "elite", description: "Everything in Pro plus personal coaching.", priceCents: 9900, interval: "MONTH", sortOrder: 3,
        features: JSON.stringify(["Everything in Pro", "2 personal training sessions / month", "Nutrition consultation", "Priority class booking", "Unlimited guest passes"]),
      },
    }),
    db.plan.create({
      data: {
        name: "Pro Annual", slug: "pro-annual", description: "Pro membership, two months free.", priceCents: 49000, interval: "YEAR", sortOrder: 4,
        features: JSON.stringify(["Everything in Pro", "2 months free", "Free merch pack", "Membership freeze up to 30 days"]),
      },
    }),
  ]);
  const [basic, pro, elite, proAnnual] = plans;

  const memberNames = [
    "Olivia Carter", "Liam Patel", "Emma Nguyen", "Noah Kim", "Ava Rossi", "Ethan Brooks", "Sophia Martin", "Mason Silva",
    "Isabella Khan", "Lucas Meyer", "Mia Fischer", "Logan Hughes", "Charlotte Dubois", "James Wright", "Amelia Costa", "Benjamin Ortiz",
  ];
  const members = [];
  for (const [i, name] of memberNames.entries()) {
    const email = i === 0 ? "member@gym.test" : `${name.split(" ")[0].toLowerCase()}.${name.split(" ")[1].toLowerCase()}@example.com`;
    members.push(
      await db.user.create({
        data: {
          name, email, passwordHash: hash, role: "MEMBER", memberCode: code(100 + i), emailVerifiedAt: i % 5 === 0 ? null : new Date(),
          phone: `+1 555 01${String(10 + i).padStart(2, "0")}`,
          createdAt: subDays(new Date(), 10 + i * 9),
          active: i !== 15,
        },
      }),
    );
  }

  // Subscriptions & payments
  const now = new Date();
  const subPlans = [pro, pro, basic, elite, proAnnual, pro, basic, pro, elite, pro, basic, pro, pro, basic, pro, basic];
  for (const [i, m] of members.entries()) {
    const plan = subPlans[i];
    const monthsBack = Math.min(i, 5);
    const start = subMonths(now, monthsBack);
    let status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "EXPIRED" = "ACTIVE";
    if (i === 6) status = "PAST_DUE";
    if (i === 9) status = "CANCELED";
    if (i === 12) status = "EXPIRED";
    if (i === 13) status = "TRIALING";
    const periodStart = plan.interval === "YEAR" ? start : subDays(now, 10 + (i % 20));
    const periodEnd = status === "EXPIRED" ? subDays(now, 3) : plan.interval === "YEAR" ? addMonths(periodStart, 12) : addMonths(periodStart, 1);
    const sub = await db.subscription.create({
      data: {
        userId: m.id, planId: plan.id, status, source: "OFFLINE", startDate: start, currentPeriodStart: periodStart, currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: i === 3, canceledAt: status === "CANCELED" || i === 3 ? subDays(now, 2) : null,
      },
    });
    // monthly payment history
    for (let k = monthsBack; k >= 0; k--) {
      const paidAt = subMonths(periodStart, k);
      const isCurrent = k === 0;
      await db.payment.create({
        data: {
          userId: m.id, subscriptionId: sub.id, amountCents: plan.priceCents, currency: plan.currency, method: i % 3 === 0 ? "CARD" : "CASH",
          status: isCurrent && status === "PAST_DUE" ? "FAILED" : isCurrent && i % 4 === 1 ? "PENDING" : "PAID",
          paidAt: isCurrent && (status === "PAST_DUE" || i % 4 === 1) ? null : paidAt, createdAt: paidAt, description: `${plan.name} membership`,
        },
      });
      if (plan.interval === "YEAR") break;
    }
  }

  // Classes
  const classDefs = [
    { name: "Power Hour", category: "Strength", level: "Intermediate", trainer: trainers[0], capacity: 14, duration: 60, color: "#7c8cff", location: "Strength room", desc: "Compound lifts, progressive overload, coached technique." },
    { name: "HIIT Blast", category: "Cardio", level: "All levels", trainer: trainers[1], capacity: 20, duration: 45, color: "#ff7a9c", location: "Studio A", desc: "45 minutes of intervals that leave nothing in the tank." },
    { name: "Sunrise Yoga", category: "Mind & Body", level: "All levels", trainer: trainers[2], capacity: 18, duration: 60, color: "#38d9c8", location: "Studio B", desc: "Slow flow and breathwork to start the day centered." },
    { name: "Boxing Fundamentals", category: "Combat", level: "Beginner", trainer: trainers[3], capacity: 12, duration: 60, color: "#ffb86b", location: "Ring zone", desc: "Footwork, combos and pad work. Gloves provided." },
    { name: "Core & Mobility", category: "Mind & Body", level: "All levels", trainer: trainers[2], capacity: 20, duration: 45, color: "#a3e635", location: "Studio B", desc: "Bulletproof your spine and hips." },
    { name: "Spin Express", category: "Cardio", level: "All levels", trainer: trainers[1], capacity: 16, duration: 30, color: "#60a5fa", location: "Cycle studio", desc: "30-minute lunchtime ride, big beats, bigger climbs." },
  ];
  const classes = [];
  for (const c of classDefs) {
    classes.push(
      await db.gymClass.create({
        data: { name: c.name, category: c.category, level: c.level, trainerId: c.trainer.id, capacity: c.capacity, durationMin: c.duration, color: c.color, location: c.location, description: c.desc },
      }),
    );
  }

  // Weekly schedule: [classIndex, weekday(1=Mon..7=Sun), hour, minute]
  const slots: Array<[number, number, number, number]> = [
    [2, 1, 6, 30], [0, 1, 18, 0], [1, 2, 7, 0], [5, 2, 12, 15], [3, 2, 19, 0], [4, 3, 7, 0], [0, 3, 18, 0], [1, 4, 18, 30], [2, 5, 6, 30], [5, 5, 12, 15],
    [3, 5, 18, 0], [0, 6, 10, 0], [1, 6, 11, 0], [4, 7, 10, 0],
  ];
  const weekStart = startOfWeek(subWeeksSafe(now, 2), { weekStartsOn: 1 });
  const sessions = [];
  for (let w = 0; w < 6; w++) {
    for (const [ci, wd, h, m] of slots) {
      const day = addDays(addWeeks(weekStart, w), wd - 1);
      const startsAt = setMinutes(setHours(startOfDay(day), h), m);
      const endsAt = new Date(startsAt.getTime() + classes[ci].durationMin * 60_000);
      sessions.push(await db.classSession.create({ data: { classId: classes[ci].id, startsAt, endsAt } }));
    }
  }

  // Bookings: past sessions get attended/no-show; future get confirmed/waitlisted
  const activeMembers = members.filter((_, i) => ![9, 12, 15].includes(i));
  for (const s of sessions) {
    const cls = classes.find((c) => c.id === s.classId)!;
    const n = Math.min(cls.capacity + (s.startsAt > now ? 1 : 0), 4 + ((s.startsAt.getDate() * 7) % 10));
    const shuffled = [...activeMembers].sort((a, b) => (a.id + s.id).localeCompare(b.id + s.id));
    for (let i = 0; i < n && i < shuffled.length; i++) {
      const past = s.startsAt < now;
      const status = past ? (i % 6 === 5 ? "NO_SHOW" : "ATTENDED") : i >= cls.capacity ? "WAITLISTED" : "CONFIRMED";
      await db.booking.create({ data: { userId: shuffled[i].id, sessionId: s.id, status, createdAt: subDays(s.startsAt, 3) } });
      if (status === "ATTENDED") await db.checkIn.create({ data: { userId: shuffled[i].id, checkedInAt: subDays(s.startsAt, 0), checkedOutAt: s.endsAt, method: "CLASS" } });
    }
  }

  // Extra floor check-ins for the last 30 days
  for (const [i, m] of activeMembers.entries()) {
    for (let d = 0; d < 30; d++) {
      if ((d + i) % 3 !== 0) continue;
      const at = setHours(subDays(now, d), 7 + ((d + i) % 12));
      await db.checkIn.create({ data: { userId: m.id, checkedInAt: at, checkedOutAt: new Date(at.getTime() + 75 * 60_000), method: d % 2 ? "QR" : "CODE", staffId: admin.id } });
    }
  }

  // Progress for the demo member
  const demo = members[0];
  for (let k = 12; k >= 0; k--) {
    const date = subDays(now, k * 7);
    await db.progressLog.create({
      data: { userId: demo.id, date, weightKg: +(82 - (12 - k) * 0.45 + Math.sin(k) * 0.3).toFixed(1), bodyFatPct: +(22 - (12 - k) * 0.35).toFixed(1), waistCm: +(90 - (12 - k) * 0.5).toFixed(1), chestCm: 100 + (12 - k) * 0.15, armsCm: 35 + (12 - k) * 0.1 },
    });
  }
  const workouts = ["Push day", "Pull day", "Legs", "HIIT Blast", "5k run", "Mobility", "Power Hour"];
  for (let k = 0; k < 18; k++) {
    await db.workoutLog.create({ data: { userId: demo.id, date: subDays(now, k * 2 + 1), title: workouts[k % workouts.length], durationMin: 40 + (k % 4) * 10, calories: 300 + (k % 5) * 60 } });
  }

  await db.announcement.createMany({
    data: [
      { title: "New recovery zone is open", body: "Sauna, cold plunge and compression boots are now available on the lower level for Pro and Elite members.", pinned: true, authorId: admin.id },
      { title: "Holiday hours", body: "We close at 6pm on Friday for staff training. Normal hours resume Saturday.", authorId: admin.id, createdAt: subDays(now, 4) },
      { title: "Summer challenge sign-ups", body: "Log 20 workouts in 30 days and win a free month. Ask at the desk to join.", authorId: admin.id, createdAt: subDays(now, 9) },
    ],
  });

  await db.notification.createMany({
    data: [
      { userId: demo.id, title: "Welcome back!", body: "You've trained 9 times this month. Keep the streak alive.", link: "/dashboard/progress" },
      { userId: demo.id, title: "Class booked", body: "HIIT Blast is confirmed for Thursday 6:30pm.", link: "/dashboard/bookings", read: true },
      { userId: admin.id, title: "3 payments pending", body: "Members with pay-at-desk balances are waiting to be marked paid.", link: "/admin/payments" },
    ],
  });

  await db.contactMessage.createMany({
    data: [
      { name: "Dana Whitfield", email: "dana@example.com", subject: "Corporate membership", message: "Hi! We're a team of 12 looking for a corporate rate. Do you offer one?" },
      { name: "Tom Becker", email: "tom@example.com", subject: "Lost water bottle", message: "Left a blue bottle in Studio A on Tuesday. Any chance it's in lost & found?", handled: true },
    ],
  });

  console.log(`
Seeded.
  Super admin: admin@gym.test / ${PASSWORD}  (branding & settings)
  Staff admin: staff@gym.test / ${PASSWORD}
  Trainer:  maya@gym.test  / ${PASSWORD}
  Member:   member@gym.test / ${PASSWORD}
  Plans: ${plans.map((p) => p.name).join(", ")} · Classes: ${classes.length} · Sessions: ${sessions.length} · Members: ${members.length}
`);
}

function subWeeksSafe(d: Date, w: number) {
  return addWeeks(d, -w);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
