# Gym management web app (single gym, rebrandable)

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma (SQLite by default) · Stripe · Spatial UI (frosted-glass, layered depth).

## Quick start

```bash
npm install            # also runs prisma generate
npm run db:push        # create the SQLite schema (prisma/dev.db)
npm run db:seed        # demo data: plans, classes, 6 weeks of sessions, members, payments
npm run dev            # http://localhost:3000
```

Demo accounts (password `Password123`):

| Role        | Email            | Notes |
|-------------|------------------|-------|
| Super admin | admin@gym.test   | Everything an admin can do, plus **Branding & settings** |
| Staff admin | staff@gym.test   | Operational admin, no branding access |
| Trainer     | maya@gym.test    | |
| Member      | member@gym.test  | |

Reset everything: `npm run db:reset`.

## Features

**Public site** — home, membership pricing, weekly class schedule (week navigation, live spots left), trainer profiles, contact form (honeypot + rate limit).

**Accounts & roles** — email/password auth (bcrypt + signed JWT cookie), email verification, forgot/reset password, login rate limiting, roles `MEMBER` / `TRAINER` / `ADMIN`, route protection in `src/proxy.ts`, audit log of sensitive actions.

**Memberships & billing** — plans with monthly/annual intervals, trials, class-per-week caps, popular flag. Two billing modes:
- `BILLING_MODE=offline` (default): plan activates immediately, a pending pay-at-desk payment is created, staff mark it paid.
- `BILLING_MODE=stripe`: Stripe Checkout (recurring price created on the fly), customer portal, webhook sync of subscription status/periods and invoices (`/api/stripe/webhook`).
Members can cancel at period end / resume. Lapsed offline memberships auto-expire.

**Classes** — class formats with trainer, capacity, duration, colour; sessions scheduled singly or weekly for N weeks; member booking with capacity, waitlist and automatic promotion; plan-based weekly booking limits; cancellation notifies booked members.

**Check-in** — every member has a QR member card (`/dashboard/card`). Front desk page (admin + trainer) checks in by code/email or via the camera (BarcodeDetector API); scanning again checks out; warns if membership is missing or past due.

**Member dashboard** — overview, membership, booking, bookings history, progress charts (weight, waist), workout log, attendance chart, payments/invoices, profile, notifications.

**Trainer area** — today's sessions, upcoming/past classes, attendance marking (present / no-show), coach profile editing, check-in desk.

**Admin area** — KPI dashboard (revenue, check-ins, past due, expiring), members CRUD with search/filter/pagination and CSV export, assign/extend/cancel memberships, record payments, plans CRUD, classes + session scheduling, subscriptions ledger with MRR, payments ledger, announcements (optionally pushed as notifications), contact inbox, reports (revenue, signups, busiest hours, plan mix, class fill rate), audit log.

**Platform** — in-app notifications with unread badge, transactional email via SMTP (logged to console when unset), health endpoint `/api/health`.

## Configuration (`.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `file:./dev.db` for SQLite. For Postgres change `provider` in `prisma/schema.prisma` and set a connection string. |
| `AUTH_SECRET` | 32+ random chars for signing session cookies. |
| `NEXT_PUBLIC_APP_URL` | Public URL used in emails and Stripe redirects. |
| `NEXT_PUBLIC_GYM_NAME` | Brand name shown everywhere. |
| `BILLING_MODE` | `offline` or `stripe`. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Required for Stripe mode. Webhook URL: `/api/stripe/webhook`; events: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`. |
| `SMTP_*`, `MAIL_FROM` | Outgoing email. Leave `SMTP_HOST` empty to print emails to the server console. |

Local Stripe testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## Project layout

```
prisma/schema.prisma      data model (users, plans, subscriptions, payments, classes, sessions, bookings, check-ins, progress, notifications, audit)
prisma/seed.ts            demo data
src/proxy.ts              auth guard for /dashboard, /trainer, /admin
src/lib/                  db, auth (sessions/hashing), stripe, mail, membership rules, validation (zod), rate limit, audit/notify
src/actions/              server actions: auth, profile, subscription, booking, progress, notifications, contact, trainer, admin
src/app/(public)/         marketing site
src/app/(auth)/           login, register, forgot/reset password
src/app/dashboard/        member area
src/app/trainer/          coach area
src/app/admin/            admin area
src/app/api/              verify email, Stripe webhook, QR image, CSV export, health
src/components/ui/        glass design-system primitives
src/components/charts/    single-series SVG chart with hover + table view
```

## Design system

Spatial UI: translucent panels (`.glass`, `.glass-strong`, `.glass-float`) over an ambient gradient backdrop with drifting colour orbs, pill-shaped controls (`.control`), large radii, soft layered shadows, hover lift (`.glass-hover`). Tokens live in `src/app/globals.css`.

## Production notes

- Replace the in-memory rate limiter (`src/lib/ratelimit.ts`) with Redis if you run multiple instances.
- Switch to Postgres for production; SQLite is for local development.
- Set a strong `AUTH_SECRET`, enable HTTPS (cookies are `secure` in production).
- Schedule `expireLapsedSubscriptions()` (currently run opportunistically on dashboard loads) via a cron if you need exact expiry timing.

## 3D hero (homepage)

Install (already in `package.json`):

```bash
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

Component structure (`src/components/hero/`):

| File | Role |
|---|---|
| `hero.tsx` | Server component. Real HTML headline, copy, CTAs, trust row; mounts the stage and four panels. |
| `hero-stage.tsx` | Client. IntersectionObserver (pauses the render loop offscreen), `prefers-reduced-motion` + WebGL detection (falls back to the poster), pointer parallax written to `--px/--py` CSS vars and a shared ref, lazy `next/dynamic` import of the scene. Includes the blurred SVG gym backdrop (fake depth of field). |
| `hero-scene.tsx` | Client. R3F `Canvas`: ACES tone mapping, DPR capped at 1.75, `frameloop` switches `always`/`never` with visibility, `AdaptiveDpr`. Lightformer-based `Environment` (no HDR download), key/fill spotlights, lime point light, `Float` + slow Y rotation + damped pointer tilt (`Rig`), two lime torus light trails, `ContactShadows`, reflective floor (`MeshReflectorMaterial`, disabled under 768px), fog. |
| `dumbbell.tsx` | Procedural model: bar Ø0.11 × 2.2 m, knurled grip, collars, 3 plates per side (Ø0.84/0.68/0.52, 0.07–0.09 thick) with bevel rings, recessed faces and a lime emissive ring on the outer plates. Materials: `MeshPhysicalMaterial` titanium (metalness 1, roughness 0.38, clearcoat 0.6), polished edge (roughness 0.18), knurl (roughness 0.7). |
| `hero-poster.tsx` | Static SVG fallback (loading / reduced motion / no WebGL). |
| `panels/panel-shell.tsx` | Glass panel: outer layer = parallax by depth (1 far … 3 near), inner layer = independent float animation (duration/delay per panel). |
| `panels/member-growth-panel.tsx` | Member count + sparkline that draws itself. |
| `panels/revenue-panel.tsx` | MRR with a smooth SVG line that draws in, area fade, pulsing end-dot. |
| `panels/qr-checkin-panel.tsx` | Decorative QR grid, scanning line, lime confirmation pulse on a 6 s loop. |
| `panels/membership-status-panel.tsx` | Billing-period arc that animates once, status row. |

All keyframes live at the end of `src/app/globals.css` under "3D hero"; every animation is disabled under `prefers-reduced-motion` with a static end state.

**Swapping in a real GLB.** Replace the body of `dumbbell.tsx` with `useGLTF("/models/dumbbell.glb")` (Drei). Author the model with the bar along the X axis, centred at the origin, ≈2.2 m long, Y up, 1 unit = 1 m. Keep ≤40k triangles, glTF 2.0 + Draco or Meshopt, PBR metal-rough materials (base colour #2a2c31, metallic 1, roughness 0.35–0.4, optional clearcoat) and one emissive material for the lime rings (#E5B93C, strength 1.5). Placement stays `position [0, 0.05, 0]` inside `<Float>`; camera is at `[0, 0.35, 4.3]`, FOV 30.

## Landing page motion (`src/components/landing/`)

| File | Role |
|---|---|
| `reveal.tsx` | `RevealProvider`: IntersectionObserver that adds `is-in` to any `[data-reveal]` element; `data-reveal-delay="1–6"` staggers. |
| `counter.tsx` | Eased count-up when scrolled into view. |
| `marquee.tsx` | Seamless infinite scroller (duplicated content, pauses on hover) for class chips and testimonials. |
| `section-divider.tsx` | Lime SVG light trail with a travelling spark (`animateMotion`). |
| `feature-icons.tsx` | Six animated SVG icons (booking slots filling, QR scan, bars + line, billing pulse, attendance tick, bell). |
| `equipment-models.tsx` | Procedural kettlebell, bumper plate and medicine ball (PBR titanium / rubber / lime emissive). |
| `equipment-scene.tsx` | Second R3F scene: scroll-driven rotation, reflective floor, contact shadows, lightformer environment. |
| `equipment-stage.tsx` | Lazy loader + scroll progress + visibility pause + static SVG poster. |
| `product-tour.tsx` | Perspective stack of three spatial panels (front desk, member app, owner dashboard) with pointer tilt, auto-cycle and click-to-front. |

All keyframes are at the end of `globals.css` under "Landing page motion" and are disabled under `prefers-reduced-motion`.

## Rebranding (super admin) and themes

- **Branding & settings** (`/admin/settings`, SUPERADMIN only): gym name, tagline, logo upload (PNG/JPG/WebP/SVG ≤ 400 KB, stored as a data URL in the `SiteSettings` row), accent colour (presets or any hex, live preview), homepage headline and sub-headline, address, phone, email, hours, Instagram, Facebook. Saving revalidates the whole site; every change is audited.
- Where it flows: `<html>` gets `--accent`/`--on-accent` from settings; the wordmark, navbar, footer, member card, page titles, favicon (when a logo is set), hero copy, contact page and email footer all read `getSettings()` (`src/lib/settings.ts`). The 3D scenes read the accent at runtime.
- **Theme switch**: dark and light. The toggle lives in the public navbar, the app top bar and the auth pages; the choice is stored in `localStorage` and applied before first paint by an inline script (`components/theme/theme-script.tsx`), defaulting to the system preference. Light tokens and utility remaps live at the end of `globals.css`; 3D stages and the product tour stay dark (`.keep-dark`).
- `NEXT_PUBLIC_GYM_NAME` is only a fallback when the settings row does not exist yet.

## Brand system (visual signature)

- **One accent.** The accent colour chosen in Branding & settings (default lime `#E5B93C`) is the only brand colour. Primary actions are lime with dark text; steel `#9fb3c8` carries secondary data; coral `#ff7a7a` is reserved for overdue/danger. No purple.
- **Mark.** `src/components/brand/brand-mark.tsx`: hex anvil with a single lime spark. The spark recurs as the end-dot on charts, the arc tip on rings, and status dots.
- **Signature ring.** `progress-ring.tsx`: thin charcoal track, lime arc, spark at the arc's tip. Used for billing-period progress (member overview, admin member detail, subscriptions list).
- **Visit map.** `attendance-map.tsx`: 7 × N-week grid of visits with lime intensity, best-day glow and streak count. Used on the member attendance page and admin member detail.
- **Chart language.** `components/charts/line-chart.tsx`: single lime series, dotted recessive grid, rounded bars on the baseline, spark on the latest value and a "Latest" chip, table toggle.
- **Two surfaces.** Marketing pages use the full spatial treatment (deep glass, drifting orbs, 3D scenes). The operational surface (`.surface-app` on the app shell) uses quieter glass, static backdrop, 15px body text and nothing below 13px.
- **Tables.** Title → one primary action (right) → filter pills with counts + search → uppercase headers → rows with a bold primary line and muted secondary line. Numeric columns right-aligned.
- **Actions.** Every mutation shows a pending state (`SubmitButton`, `ActionButton`, `ConfirmButton`, sidebar link spinner), destructive actions confirm first, each app segment has `loading.tsx` and `error.tsx`.
- **Hero.** Brushed anisotropic titanium, long soft key light, lime rim, tighter 26° lens, stage ring on the floor, and sequenced callout lines that connect each panel to the object in the product's flow: check-in → attendance → membership → revenue.
