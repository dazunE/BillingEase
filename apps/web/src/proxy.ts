import { NextResponse, type NextRequest } from "next/server";

// Fast, optimistic check: no session cookie → sign in first. The real session
// check happens on the server in every page and action (see lib/auth.ts).
export function proxy(request: NextRequest) {
  if (!request.cookies.has("be_session")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/onboarding"],
};
