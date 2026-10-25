import Link from "next/link";
import { Wordmark } from "@/components/brand/brand-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      <ThemeToggle className="absolute right-4 top-4" />
      <Link href="/" className="mb-6" aria-label="Home">
        <Wordmark />
      </Link>
      <div className="glass glass-strong glass-float w-full max-w-md p-8 rise">{children}</div>
      <p className="mt-6 text-xs text-fg-subtle">
        <Link href="/" className="link link-muted">← Back to site</Link>
      </p>
    </div>
  );
}
