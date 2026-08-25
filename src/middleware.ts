import { NextResponse, type NextRequest } from "next/server";
import { isAuthEnabled, readSessionCookie, verifySessionToken } from "@/lib/session";

/**
 * Page guard: with JARVIS_OPERATOR_PASSWORD set, every page except /login
 * requires a valid session cookie. API routes are guarded in their handlers
 * using explicit operator or scoped-service guards in their handlers.
 */
export async function middleware(request: NextRequest) {
  if (!isAuthEnabled()) return NextResponse.next();
  if (await verifySessionToken(readSessionCookie(request))) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = request.nextUrl.pathname === "/" ? "" : `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next|images|favicon\\.ico|icon\\.svg|login).*)"]
};
