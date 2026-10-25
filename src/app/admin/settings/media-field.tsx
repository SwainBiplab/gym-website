"use client";
import { useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Upload an MP4/WebM (or paste an https link). Shows progress, errors and a preview; value is submitted with the settings form. */
export function MediaField({ name, label, hint, initial }: { name: string; label: string; hint?: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function upload(file: File) {
    setError(null);
    setBusy(true);
    setPct(0);
    const fd = new FormData();
    fd.set("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media");
    xhr.upload.onprogress = (e) => e.lengthComputable && setPct(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      setBusy(false);
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) setValue(body.url);
        else setError(body.error ?? "Upload failed.");
      } catch {
        setError("Upload failed. The file may be too large for the server.");
      }
      if (fileRef.current) fileRef.current.value = "";
    };
    xhr.onerror = () => {
      setBusy(false);
      setError("Network error during upload. Try again.");
    };
    xhr.send(fd);
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</span>
      <input type="hidden" name={name} value={value} />
      {value && (
        <div className="glass glass-sm overflow-hidden">
          <video src={value} muted loop playsInline controls preload="metadata" className="aspect-video w-full bg-black object-cover" />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <Button type="button" variant="glass" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? `Uploading ${pct}%` : value ? "Replace video" : "Upload video"}
        </Button>
        {value && !busy && (
          <Button type="button" variant="ghost" size="sm" onClick={() => window.confirm("Remove this video and go back to the 3D scene?") && setValue("")}>
            <Trash2 className="h-4 w-4" /> Remove
          </Button>
        )}
      </div>
      {busy && (
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      <Input value={value.startsWith("/api/media/") ? "" : value} onChange={(e) => setValue(e.target.value)} placeholder="…or paste an https:// video link" aria-label={`${label} link`} className="h-10" disabled={busy || value.startsWith("/api/media/")} />
      {error ? <p role="alert" className="text-sm text-accent-3">{error}</p> : hint ? <p className="text-xs text-fg-subtle">{hint}</p> : null}
    </div>
  );
}
