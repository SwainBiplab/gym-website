"use client";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="glass glass-strong max-w-md p-10 text-center">
        <p className="text-2xl font-semibold">Something went wrong</p>
        <p className="mt-2 text-sm text-fg-muted">{error.message || "Unexpected error."}</p>
        <Button className="mt-6" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
