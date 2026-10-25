import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "@/components/brand/brand-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { MobileNav } from "./mobile-nav";

export const links = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Membership" },
  { href: "/classes", label: "Classes" },
  { href: "/trainers", label: "Trainers" },
  { href: "/contact", label: "Contact" },
];

export async function Navbar() {
  const session = await getCurrentUser();
  const dash = (session?.role === "ADMIN" || session?.role === "SUPERADMIN") ? "/admin" : session?.role === "TRAINER" ? "/trainer" : "/dashboard";
  return (
    <header className="sticky top-4 z-40 px-4">
      <nav className="glass glass-pill glass-strong mx-auto flex max-w-6xl items-center justify-between gap-4 px-3 py-2 pl-5">
        <Link href="/" aria-label="Home">
          <Wordmark />
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="rounded-full px-4 py-2 text-sm text-fg-muted transition hover:bg-white/8 hover:text-fg">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {session ? (
            <ButtonLink href={dash} size="sm">
              My space
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink href="/register" size="sm">
                Join now
              </ButtonLink>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <MobileNav links={session ? [...links, { href: dash, label: "My space" }] : [...links, { href: "/login", label: "Sign in" }, { href: "/register", label: "Join now" }]} />
        </div>
      </nav>
    </header>
  );
}
