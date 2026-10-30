import { callRaw } from "@/lib/api";

/** Sends a photo or PDF to the capture agent: the multipart form is streamed on to the API. */
export async function POST(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  if (!type.startsWith("multipart/form-data")) return Response.json({ error: { code: "invalid", message: "Send the file as a form upload." } }, { status: 400 });
  const res = await callRaw("/capture", { method: "POST", body: request.body ?? undefined, contentType: type });
  const json = await res.json().catch(() => ({ error: { code: "server", message: "The upload didn't go through. Try again." } }));
  return Response.json(json, { status: res.status });
}
