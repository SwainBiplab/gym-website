import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED: Array<{ prefix: string; roles?: string[] }> = [
  { prefix: "/admin", roles: ["ADMIN", "SUPERADMIN"] },
  { prefix: "/trainer", roles: ["TRAINER", "ADMIN", "SUPERADMIN"] },
  { prefix: "/dashboard" },
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rule = PROTECTED.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return NextResponse.next();

  const token = request.cookies.get("gym_session")?.value;
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  if (!token) return NextResponse.redirect(loginUrl);

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    const role = String(payload.role ?? "MEMBER");
    if (rule.roles && !rule.roles.includes(role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete("gym_session");
    return res;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/trainer/:path*", "/dashboard/:path*"],
};
