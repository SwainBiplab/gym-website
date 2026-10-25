import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";
import { MAX_VIDEO_BYTES, UPLOAD_DIR, VIDEO_TYPES, looksLikeVideo } from "@/lib/media";
import { audit } from "@/lib/activity";

export const runtime = "nodejs";

/** Super-admin video upload. Returns { url } pointing at /api/media/<file>. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPERADMIN") return NextResponse.json({ error: "Only the super admin can upload media." }, { status: 403 });
  let file: File | null = null;
  try {
    const fd = await req.formData();
    const f = fd.get("file");
    file = f instanceof File ? f : null;
  } catch {
    return NextResponse.json({ error: "Upload could not be read. Try a smaller file." }, { status: 400 });
  }
  if (!file || file.size === 0) return NextResponse.json({ error: "Choose a video file." }, { status: 400 });
  const type = VIDEO_TYPES[file.type];
  if (!type) return NextResponse.json({ error: "Use an MP4 or WebM video." }, { status: 415 });
  if (file.size > MAX_VIDEO_BYTES) return NextResponse.json({ error: `Video is ${(file.size / 1048576).toFixed(0)} MB. The limit is ${MAX_VIDEO_BYTES / 1048576} MB. Compress it first.` }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  if (!looksLikeVideo(buf)) return NextResponse.json({ error: "That file does not look like a valid MP4 or WebM." }, { status: 415 });
  const name = `${randomUUID()}.${type.ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), buf);
  await audit(user.id, "media.upload", "Media", name, { bytes: file.size });
  return NextResponse.json({ url: `/api/media/${name}` });
}
