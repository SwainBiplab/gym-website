import { NextResponse, type NextRequest } from "next/server";
import QRCode from "qrcode";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/** Renders the signed-in member's QR code (or any member's for staff via ?user=id). */
export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const targetId = req.nextUrl.searchParams.get("user");
  let code = me.memberCode;
  if (targetId && targetId !== me.id) {
    if (me.role === "MEMBER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const u = await db.user.findUnique({ where: { id: targetId } });
    if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
    code = u.memberCode;
  }
  const svg = await QRCode.toString(code, { type: "svg", margin: 1, width: 320, color: { dark: "#0b0d14", light: "#ffffff" } });
  return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "private, max-age=3600" } });
}
