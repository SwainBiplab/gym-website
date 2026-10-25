import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { PlanCard } from "@/components/site/plan-card";
import { Hero } from "@/components/hero/hero";
import { RevealProvider } from "@/components/landing/reveal";
import { Counter } from "@/components/landing/counter";
import { Marquee } from "@/components/landing/marquee";
import { SectionDivider } from "@/components/landing/section-divider";
import { EquipmentStage } from "@/components/landing/equipment-stage";
import { ProductTour } from "@/components/landing/product-tour";
import { BookingIcon, QrIcon, ChartIcon, BillingIcon, AttendanceIcon, NotifyIcon } from "@/components/landing/feature-icons";

export default async function HomePage() {
  const session = await getCurrentUser();
  const settings = await getSettings();
  const [memberCount, trainers, plans, classes, checkIns] = await Promise.all([
    db.user.count({ where: { role: "MEMBER", active: true } }),
    db.user.findMany({ where: { role: "TRAINER", trainerProfile: { featured: true } }, include: { trainerProfile: true }, take: 3 }),
    db.plan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, take: 3 }),
    db.gymClass.findMany({ where: { active: true }, include: { trainer: true }, orderBy: { name: "asc" } }),
    db.checkIn.count(),
  ]);

  const features = [
    { Icon: BookingIcon, title: "Class booking that fills itself", text: "Live capacity, waitlists that auto-promote, plan-based limits and reminders." },
    { Icon: QrIcon, title: "QR + camera check-in", text: "Members carry a QR card. The desk scans it, sees the plan status and any balance due." },
    { Icon: BillingIcon, title: "Billing on autopilot", text: "Stripe subscriptions, trials, pay-at-desk fallback, dunning and receipts." },
    { Icon: ChartIcon, title: "See your progress", text: "Weight, measurements and visits charted over time, so you know what is working." },
    { Icon: AttendanceIcon, title: "Attendance & progress", text: "Trainers mark attendance in one tap. Members log weight, measurements and workouts." },
    { Icon: NotifyIcon, title: "Announcements & nudges", text: "Pinned club news, in-app notifications and transactional email out of the box." },
  ];

  const testimonials = [
    ["“The booking system alone is worth it. I haven't missed a class in 3 months.”", "Olivia C., Pro member"],
    ["“Coaches actually watch your form. Added 40kg to my deadlift this year.”", "Liam P., Elite member"],
    ["“Sunrise yoga before work changed my whole routine.”", "Emma N., Basic member"],
    ["“The front desk check-in is instant. No more fobs, no more queues.”", "Dana W., Member"],
    ["“Booked my first class from the car park and made it in with time to spare.”", "Tom B., Member"],
    ["“Members love the QR card. No more fobs.”", "Priya N., Head coach"],
  ];

  return (
    <RevealProvider>
      <div className="space-y-28">
        <Hero signedIn={!!session} />

        {/* Live counters */}
        <section className="relative">
          <div className="orb -left-20 top-0 h-64 w-64 bg-accent/40" />
          <dl className="relative grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { v: <Counter to={memberCount} suffix="+" />, l: "active members" },
              { v: <Counter to={checkIns} />, l: "check-ins logged" },
              { v: <Counter to={classes.length} />, l: "class formats every week" },
              { v: <Counter to={58} suffix="s" prefix="<" />, l: "to activate a membership" },
            ].map((s, i) => (
              <div key={s.l} data-reveal data-reveal-delay={String(i + 1)} className="glass glass-sm glass-hover p-5">
                <dt className="text-3xl font-semibold tracking-tight">{s.v}</dt>
                <dd className="mt-1 text-xs text-fg-muted">{s.l}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Class marquee */}
        <section data-reveal className="-mx-4">
          <Marquee speed={38}>
            {classes.map((c) => (
              <span key={c.id} className="glass glass-pill flex items-center gap-3 px-4 py-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color, boxShadow: `0 0 10px ${c.color}` }} />
                {c.name}
                <span className="text-fg-subtle">{c.category} · {c.durationMin} min · {c.trainer?.name ?? "Staff"}</span>
              </span>
            ))}
          </Marquee>
        </section>

        {/* Features */}
        <section className="relative">
          <div className="orb right-0 top-10 h-72 w-72 bg-accent-2/30" />
          <div className="mb-10 text-center" data-reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Platform</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">Everything you need to stay consistent</h2>
          </div>
          <div className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ Icon, title, text }, i) => (
              <div key={title} data-reveal data-reveal-delay={String((i % 3) + 1)} className="glass glass-hover group p-6">
                <div className="mb-4 inline-grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-white/10 to-transparent ring-1 ring-white/10 transition group-hover:ring-[var(--accent)]/50">
                  <Icon />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-fg-muted">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* 3D equipment showcase */}
        <section className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div data-reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">The floor</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">Serious kit, coached properly</h2>
            <p className="mt-4 text-fg-muted">Free weights, racks, kettlebells, turf and a dedicated recovery zone. Every session is coached, every visit is logged with a tap of your QR card.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {["QR member card check-in", "Open 5am to 11pm, every day", "Strength, HIIT, yoga, boxing and cycling", "Sauna, cold plunge and recovery zone"].map((f, i) => (
                <li key={f} data-reveal data-reveal-delay={String(i + 1)} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--accent)]/15 text-accent"><Check className="h-3 w-3" /></span>
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-fg-subtle">Scroll to rotate the set.</p>
          </div>
          <div data-reveal data-reveal-delay="2">
            <EquipmentStage videoUrl={settings.showcaseVideo} />
          </div>
        </section>

        <SectionDivider flip />

        {/* Product tour */}
        <section className="relative pb-4">
          <div className="orb left-1/3 top-0 h-80 w-80 bg-[var(--accent)]/20" />
          <div className="mb-12 text-center" data-reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">The app</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">Front desk, your phone, the office</h2>
            <p className="mx-auto mt-3 max-w-xl text-fg-muted">Check-in, bookings and progress stay in sync everywhere. Hover to tilt, click a panel to bring it forward.</p>
          </div>
          <div data-reveal data-reveal-delay="2">
            <ProductTour />
          </div>
        </section>

        {/* Plans */}
        <section>
          <div className="mb-8 text-center" data-reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Membership</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">Simple plans, no contracts</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((p, i) => (
              <div key={p.id} data-reveal data-reveal-delay={String(i + 1)}>
                <PlanCard
                  plan={p}
                  action={
                    <Link href={session ? `/dashboard/membership?plan=${p.slug}` : `/register?plan=${p.slug}`} className={buttonClass(p.popular ? "primary" : "glass", "md", "w-full")}>
                      {p.trialDays > 0 ? "Start free trial" : "Choose plan"}
                    </Link>
                  }
                />
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-fg-muted" data-reveal>
            <Link href="/pricing" className="link">Compare all plans</Link>
          </p>
        </section>

        {/* Trainers */}
        <section>
          <div className="mb-8 flex items-end justify-between" data-reveal>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Coaches</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Meet the team</h2>
            </div>
            <Link href="/trainers" className="link text-sm">All trainers</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {trainers.map((t, i) => (
              <div key={t.id} data-reveal data-reveal-delay={String(i + 1)} className="glass glass-hover p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[var(--accent)]/70 to-accent/70 text-sm font-semibold text-black">
                    {t.name.split(" ").map((s) => s[0]).join("")}
                  </span>
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-fg-muted">{t.trainerProfile?.yearsExperience} yrs experience</p>
                  </div>
                </div>
                <p className="text-sm text-fg-muted">{t.trainerProfile?.bio}</p>
                <p className="mt-3 text-xs text-accent">{t.trainerProfile?.specialties}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials marquee */}
        <section className="-mx-4 space-y-3" data-reveal>
          <Marquee speed={55}>
            {testimonials.slice(0, 3).map(([q, who]) => (
              <figure key={who} className="glass w-80 shrink-0 p-5">
                <blockquote className="text-sm leading-snug">{q}</blockquote>
                <figcaption className="mt-3 text-xs text-fg-muted">{who}</figcaption>
              </figure>
            ))}
          </Marquee>
          <Marquee speed={62} reverse>
            {testimonials.slice(3).map(([q, who]) => (
              <figure key={who} className="glass w-80 shrink-0 p-5">
                <blockquote className="text-sm leading-snug">{q}</blockquote>
                <figcaption className="mt-3 text-xs text-fg-muted">{who}</figcaption>
              </figure>
            ))}
          </Marquee>
        </section>

        {/* CTA */}
        <section data-reveal className="glass glass-strong glass-float relative overflow-hidden p-10 text-center md:p-16">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--accent)]/15 via-transparent to-accent-2/15" />
          <div className="orb -right-10 -top-10 h-60 w-60 bg-[var(--accent)]/30" />
          <div className="relative">
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Your first week is on us.</h2>
            <p className="mx-auto mt-3 max-w-lg text-fg-muted">Create an account, pick a plan, and your free trial starts the moment you walk in.</p>
            <div className="mt-6">
              <ButtonLink href={session ? "/dashboard/membership" : "/register"} size="lg" className="hero-cta">
                Get started <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </section>
      </div>
    </RevealProvider>
  );
}
