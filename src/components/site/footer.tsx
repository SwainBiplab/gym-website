import Link from "next/link";
import { getSettings } from "@/lib/settings";

export async function Footer() {
  const s = await getSettings();
  return (
    <footer className="mt-24 px-4 pb-8">
      <div className="glass mx-auto flex max-w-6xl flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold">{s.name}</p>
          <p className="mt-1 text-sm text-fg-muted">{[s.hours, s.address].filter(Boolean).join(" · ")}</p>
          {(s.instagram || s.facebook) && (
            <p className="mt-1 text-sm text-fg-subtle">
              {s.instagram && <a href={`https://instagram.com/${s.instagram}`} className="link link-muted" target="_blank" rel="noreferrer">@{s.instagram}</a>}
              {s.instagram && s.facebook && " · "}
              {s.facebook && <a href={s.facebook} className="link link-muted" target="_blank" rel="noreferrer">Facebook</a>}
            </p>
          )}
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted">
          <li><Link href="/pricing" className="link link-muted">Membership</Link></li>
          <li><Link href="/classes" className="link link-muted">Classes</Link></li>
          <li><Link href="/trainers" className="link link-muted">Trainers</Link></li>
          <li><Link href="/contact" className="link link-muted">Contact</Link></li>
          <li><Link href="/login" className="link link-muted">Member login</Link></li>
        </ul>
        <p className="text-xs text-fg-subtle">© {new Date().getFullYear()} {s.name}</p>
      </div>
    </footer>
  );
}
