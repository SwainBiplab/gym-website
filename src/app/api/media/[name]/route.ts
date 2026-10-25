import { NextResponse, type NextRequest } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { MEDIA_NAME, UPLOAD_DIR, VIDEO_TYPES } from "@/lib/media";

export const runtime = "nodejs";

/** Public video streaming with HTTP Range support (needed for seeking and iOS playback). */
export async function GET(req: NextRequest, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  if (!MEDIA_NAME.test(name)) return new NextResponse("Not found", { status: 404 });
  const file = path.join(UPLOAD_DIR, name);
  let size: number;
  try {
    size = (await stat(file)).size;
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  const mime = Object.values(VIDEO_TYPES).find((t) => name.endsWith(`.${t.ext}`))?.mime ?? "video/mp4";
  const headers: Record<string, string> = { "Content-Type": mime, "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=31536000, immutable" };
  const range = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end || start >= size) return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    const body = Readable.toWeb(createReadStream(file, { start, end })) as unknown as ReadableStream;
    return new NextResponse(body, { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) } });
  }
  const body = Readable.toWeb(createReadStream(file)) as unknown as ReadableStream;
  return new NextResponse(body, { status: 200, headers: { ...headers, "Content-Length": String(size) } });
}
