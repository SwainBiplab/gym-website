import path from "node:path";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
export const VIDEO_TYPES: Record<string, { ext: string; mime: string }> = {
  "video/mp4": { ext: "mp4", mime: "video/mp4" },
  "video/webm": { ext: "webm", mime: "video/webm" },
};
export const MEDIA_NAME = /^[a-f0-9-]{36}\.(mp4|webm)$/;

/** Accepts only our own media route or an https URL. */
export function isAllowedMediaUrl(v: string) {
  return /^\/api\/media\/[a-f0-9-]{36}\.(mp4|webm)$/.test(v) || /^https:\/\/[^\s]{4,300}$/.test(v);
}
export function localMediaName(v: string | null | undefined) {
  const m = v?.match(/^\/api\/media\/([a-f0-9-]{36}\.(?:mp4|webm))$/);
  return m ? m[1] : null;
}
/** MP4 has "ftyp" at byte 4; WebM/Matroska starts 1A 45 DF A3. */
export function looksLikeVideo(buf: Buffer) {
  return (buf.length > 12 && buf.subarray(4, 8).toString("ascii") === "ftyp") || (buf.length > 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3);
}
