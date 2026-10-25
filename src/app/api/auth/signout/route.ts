import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

/** Clears the session cookie and sends the visitor to the sign-in page. Used when a cookie refers to a user that no longer exists. */
export async function GET(req: NextRequest) {
  const next = req.nextUrl.searchParams.get("next");
  const url = new URL("/login", req.nextUrl.origin);
  if (next && next.startsWith("/") && !next.startsWith("//")) url.searchParams.set("next", next);
  url.searchParams.set("expired", "1");
  const res = NextResponse.redirect(url);
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
