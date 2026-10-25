"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button aria-label="Menu" onClick={() => setOpen((o) => !o)} className="control grid h-10 w-10 place-items-center">
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <div className="glass glass-strong glass-float absolute left-4 right-4 top-16 p-2 rise">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-sm hover:bg-white/8">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
