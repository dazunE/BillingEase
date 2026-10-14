import { home } from "@billingease/contracts";
import { NextResponse, type NextRequest } from "next/server";
import { ApiFailure, call } from "@/lib/api";

/** Live results for the header's search box, as you type. */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 100);
  if (!q.trim()) return NextResponse.json({ q, results: [] });
  try {
    return NextResponse.json(await call(home.search, { query: { q } }));
  } catch (err) {
    if (err instanceof ApiFailure) return NextResponse.json({ q, results: [], error: err.message }, { status: err.status });
    throw err;
  }
}
