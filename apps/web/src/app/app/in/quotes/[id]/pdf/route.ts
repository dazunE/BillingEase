import { callRaw } from "@/lib/api";

/** Streams the quote PDF from the API with the signed-in user's session. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const download = new URL(req.url).searchParams.get("download") === "1";
  const res = await callRaw(`/quotes/${encodeURIComponent(id)}/pdf${download ? "?download=1" : ""}`);
  if (!res.ok) return new Response(res.status === 404 ? "That quote wasn't found." : "Couldn't make the PDF.", { status: res.status, headers: { "content-type": "text/plain; charset=utf-8" } });
  return new Response(res.body, {
    headers: { "content-type": "application/pdf", "content-disposition": res.headers.get("content-disposition") ?? "inline", "cache-control": "private, no-store" },
  });
}
