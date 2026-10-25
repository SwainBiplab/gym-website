import { cn } from "@/lib/utils";
import { getSettings } from "@/lib/settings";

/** Default mark when no logo is uploaded: a charcoal hex with a single accent spark. */
export function BrandMark({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={cn("shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id="bm-body" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#3a3d44" />
          <stop offset="1" stopColor="#14161b" />
        </linearGradient>
      </defs>
      <path d="M20 2 L35.6 11 V29 L20 38 L4.4 29 V11 Z" fill="url(#bm-body)" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
      <path d="M12 26 L20 14 L24 20 L28 15" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <circle cx="28" cy="15" r="3.2" fill="var(--accent)" />
      <circle cx="28" cy="15" r="5.5" fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.45" />
    </svg>
  );
}

/** Logo + name from Site settings (server component). */
export async function Wordmark({ className, sub }: { className?: string; sub?: string }) {
  const s = await getSettings();
  return (
    <span className={cn("flex items-center gap-2.5 font-semibold tracking-tight", className)}>
      {s.logoDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.logoDataUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
      ) : (
        <BrandMark />
      )}
      <span className="leading-tight">
        {s.name}
        {sub && <span className="block text-[11px] font-medium uppercase tracking-[0.22em] text-fg-subtle">{sub}</span>}
      </span>
    </span>
  );
}
