"use client";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  return (
    <div role="alert" className="glass border-accent-3/30 p-8">
      <p className="flex items-center gap-2 text-lg font-semibold">
        <AlertTriangle className="h-5 w-5 text-accent-3" /> This page hit an error
      </p>
      <p className="mt-2 text-sm text-fg-muted">{error.message || "Something went wrong while loading this page."}</p>
      {error.digest && <p className="mt-1 font-mono text-xs text-fg-subtle">ref {error.digest}</p>}
      <div className="mt-5 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="glass" onClick={() => router.push("/")}>Go home</Button>
      </div>
    </div>
  );
}
