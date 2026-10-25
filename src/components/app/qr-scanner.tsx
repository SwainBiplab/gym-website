"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { checkInByCodeAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";

type Detector = { detect(src: ImageBitmapSource): Promise<Array<{ rawValue: string }>> };
declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats: string[] }) => Detector;
  }
}

/** Uses the browser BarcodeDetector API where available (Chrome/Edge/Android). */
export function QrScanner() {
  const video = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const supported = useSyncExternalStore(
    () => () => {},
    () => !!window.BarcodeDetector,
    () => null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const last = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  useEffect(() => {
    if (!active || !video.current || !window.BarcodeDetector) return;
    let stream: MediaStream | null = null;
    let timer: number;
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.current!.srcObject = stream;
        await video.current!.play();
        const tick = async () => {
          try {
            const codes = await detector.detect(video.current!);
            const code = codes[0]?.rawValue;
            if (code && (code !== last.current.code || Date.now() - last.current.at > 8000)) {
              last.current = { code, at: Date.now() };
              const fd = new FormData();
              fd.set("code", code);
              fd.set("method", "QR");
              const r = await checkInByCodeAction(undefined, fd);
              setMessage(r?.error ?? r?.message ?? null);
            }
          } catch {
            /* ignore frame errors */
          }
          timer = window.setTimeout(tick, 500);
        };
        tick();
      } catch (e) {
        setMessage(`Camera unavailable: ${(e as Error).message}`);
        setActive(false);
      }
    })();
    return () => {
      window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active]);

  if (supported === false) return <p className="text-sm text-fg-muted">This browser can&apos;t scan QR codes natively. Use the code field instead, or open this page in Chrome on a phone or tablet.</p>;
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <video ref={video} className={`aspect-video w-full ${active ? "" : "hidden"}`} muted playsInline />
        {!active && <div className="grid aspect-video place-items-center text-sm text-fg-subtle">Camera off</div>}
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" variant={active ? "danger" : "glass"} size="sm" onClick={() => setActive((a) => !a)}>
          {active ? "Stop camera" : "Start camera"}
        </Button>
        {message && <span className="text-sm text-fg-muted">{message}</span>}
      </div>
    </div>
  );
}
