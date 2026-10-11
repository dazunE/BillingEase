import { NextResponse, type NextRequest } from "next/server";

// Fast, optimistic check: no session cookie → sign in first. The API checks the session
// on every request; this only saves a round trip.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("be_session")) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/setup"],
};
