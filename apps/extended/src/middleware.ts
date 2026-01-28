import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Authentication disabled - all routes are public
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Redirect login/register to dashboard since auth is disabled
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
