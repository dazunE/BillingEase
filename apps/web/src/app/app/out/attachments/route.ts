import { callRaw } from "@/lib/api";

/**
 * Uploads a photo or PDF to an expense or bill. The browser posts the multipart form here and
 * it is streamed on to the API, which checks the file and that the expense or bill is yours.
 */
export async function POST(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  if (!type.startsWith("multipart/form-data")) return Response.json({ error: { code: "invalid", message: "Send the file as a form upload." } }, { status: 400 });
  const res = await callRaw("/out/attachments", { method: "POST", body: request.body ?? undefined, contentType: type });
  const json = await res.json().catch(() => ({ error: { code: "server", message: "The upload didn't go through. Try again." } }));
  return Response.json(json, { status: res.status });
}
