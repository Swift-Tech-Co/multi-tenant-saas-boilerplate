import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "./lib/auth";

const PUBLIC_PATHS = ["/login", "/register", "/invite", "/api/auth"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const session = await verifySession(token);
  if (!session) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("session");
    return res;
  }

  // Inject tenant context via header for server components
  const res = NextResponse.next();
  res.headers.set("x-user-id", session.userId);
  res.headers.set("x-org-id", session.orgId);
  res.headers.set("x-member-role", session.role);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
