import { callRaw } from "@/lib/api";

/** Shows or downloads an attachment (`?download=1`), only for the business it belongs to. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const download = new URL(request.url).searchParams.get("download") === "1";
  const res = await callRaw(`/out/attachments/${id}/file${download ? "?download=1" : ""}`);
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    return new Response(json?.error?.message ?? "That file wasn't found.", { status: res.status, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  const headers = new Headers({ "x-content-type-options": "nosniff", "cache-control": "private, no-store" });
  for (const h of ["content-type", "content-length", "content-disposition"]) {
    const v = res.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(res.body, { status: 200, headers });
}
