import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { getSettings } from "@/lib/settings";
import { HeroStage } from "./hero-stage";
import { MemberGrowthPanel } from "./panels/member-growth-panel";
import { RevenuePanel } from "./panels/revenue-panel";
import { QrCheckInPanel } from "./panels/qr-checkin-panel";
import { MembershipStatusPanel } from "./panels/membership-status-panel";

/**
 * Homepage hero. Copy and CTAs are real HTML; the 3D scene is lazy-loaded client-side
 * (see hero-stage.tsx) with a static SVG poster as the fallback.
 */
export async function Hero({ signedIn }: { signedIn: boolean }) {
  const s = await getSettings();
  return (
    <section className="hero relative grid items-center gap-10 pt-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6">
      <div className="rise relative z-10">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" /> {s.name}{s.tagline ? ` · ${s.tagline}` : ""}
        </p>
        <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.02em] md:text-6xl xl:text-7xl">
          <HeroTitle title={s.heroTitle} />
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">{s.heroSubtitle}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={signedIn ? "/dashboard" : "/register"} className={buttonClass("primary", "lg", "hero-cta")}>
            {signedIn ? "Go to my space" : "Start free trial"} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/pricing" className={buttonClass("glass", "lg")}>
            See pricing
          </Link>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-fg-subtle">
          <li className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> Secure card payments</li>
          <li>No contracts</li>
          <li>Free trial on eligible plans</li>
          <li>Cancel anytime</li>
        </ul>
      </div>

      <HeroStage videoUrl={s.heroVideo}>
        <MemberGrowthPanel className="left-2 top-4 hidden sm:block lg:-left-6 lg:top-8" />
        <RevenuePanel className="right-2 top-3 sm:right-0 lg:-right-4 lg:top-10" />
        <QrCheckInPanel className="bottom-4 left-2 sm:left-4 lg:-left-2 lg:bottom-10" />
        <MembershipStatusPanel className="bottom-5 right-2 hidden sm:block lg:-right-8 lg:bottom-16" />
      </HeroStage>
    </section>
  );
}

/** Highlights the last two words of the headline in the accent gradient. */
function HeroTitle({ title }: { title: string }) {
  const words = title.trim().split(/\s+/);
  if (words.length < 3) return <span className="hero-lime-text">{title}</span>;
  const head = words.slice(0, -2).join(" ");
  const tail = words.slice(-2).join(" ");
  return (
    <>
      {head} <span className="hero-lime-text">{tail}</span>
    </>
  );
}
