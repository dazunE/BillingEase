import { timingSafeEqual } from "node:crypto";
import { auth } from "@billingease/contracts";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { ApiFailure, call } from "@/lib/api";
import { GOOGLE_COOKIE, googleRedirectUri, publicUrl, safeNext, type GoogleAttempt } from "@/lib/google";
import { setSession, setTwoStep } from "@/lib/session";

function sameState(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Google sends the person back here with a one-time code; the API swaps it for who they are. */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const jar = await cookies();
  const raw = jar.get(GOOGLE_COOKIE)?.value;
  jar.delete({ name: GOOGLE_COOKIE, path: "/auth/google" });

  let attempt: GoogleAttempt | null = null;
  try {
    attempt = raw ? (JSON.parse(raw) as GoogleAttempt) : null;
  } catch {
    attempt = null;
  }
  const intent = attempt?.intent ?? "signin";
  const back = (code: string) => NextResponse.redirect(publicUrl(`${intent === "link" ? "/app/settings/sign-in" : "/sign-in"}?google=${code}`, req));

  if (p.get("error")) return back("cancelled");
  const code = p.get("code"), state = p.get("state");
  if (!attempt || !code || !state || !sameState(state, attempt.state)) return back("expired");

  const body = { code, codeVerifier: attempt.verifier, nonce: attempt.nonce, redirectUri: googleRedirectUri(req) };
  try {
    if (intent === "link") {
      await call(auth.linkGoogle, { body });
      return NextResponse.redirect(publicUrl("/app/settings/sign-in?google=connected", req));
    }
    const s = await call(auth.google, { body, token: null });
    if ("ticket" in s) {
      await setTwoStep(s.ticket, s.expiresAt, safeNext(attempt.next, "/app"));
      return NextResponse.redirect(publicUrl("/sign-in/code", req));
    }
    await setSession(s.token, s.expiresAt);
    // A new account made to accept an invitation goes back to it, not to setting up a business.
    const joining = !!attempt.next && attempt.next.startsWith("/invite/");
    const to = s.created && !joining ? `/setup${attempt.country ? `?country=${attempt.country}` : ""}` : safeNext(attempt.next, "/app");
    return NextResponse.redirect(publicUrl(to, req));
  } catch (err) {
    if (err instanceof ApiFailure) return back(err.status === 401 ? "expired" : err.code);
    throw err;
  }
}
