import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="glass glass-strong max-w-md p-10 text-center">
        <p className="text-6xl font-semibold text-gradient">404</p>
        <p className="mt-2 text-fg-muted">That page doesn&apos;t exist.</p>
        <Link href="/" className={buttonClass("primary", "md", "mt-6")}>Back home</Link>
      </div>
    </div>
  );
}
