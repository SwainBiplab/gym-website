"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type NavLink = { href: string; label: string; icon: ReactNode; exact?: boolean };

function Pending() {
  const { pending } = useLinkStatus();
  return pending ? <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-fg-subtle" aria-label="Loading" /> : null;
}

export function SidebarNav({ items, onNavigate }: { items: NavLink[]; onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <ul className="space-y-1">
      {items.map(({ href, label, icon, exact }) => {
        const active = exact ? path === href : path === href || path.startsWith(href + "/");
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition",
                active ? "bg-white/12 text-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" : "text-fg-muted hover:bg-white/6 hover:text-fg",
              )}
            >
              <span className={cn("grid h-4 w-4 place-items-center [&>svg]:h-4 [&>svg]:w-4", active && "text-accent")}>{icon}</span>
              {label}
              <Pending />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
