import { business, LOGO_MAX_BYTES } from "@billingease/contracts";
import { ApiFailure, call, callRaw } from "@/lib/api";

/** The business's logo: shown (GET), uploaded as the raw image bytes (PUT) or removed (DELETE). */
export async function GET() {
  const res = await callRaw("/business/logo");
  if (!res.ok) return new Response("No logo", { status: res.status });
  const headers = new Headers({ "x-content-type-options": "nosniff", "cache-control": "private, max-age=3600" });
  const type = res.headers.get("content-type");
  if (type === "image/png" || type === "image/jpeg") headers.set("content-type", type);
  return new Response(res.body, { status: 200, headers });
}

const fail = (err: unknown) => {
  if (err instanceof ApiFailure) return Response.json({ message: err.message }, { status: err.status });
  return Response.json({ message: "That didn't work. Try again." }, { status: 500 });
};

export async function PUT(request: Request) {
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length) return Response.json({ message: "Choose an image for your logo." }, { status: 400 });
  if (bytes.length > LOGO_MAX_BYTES) return Response.json({ message: "That image is over 1 MB. Save a smaller version and try again." }, { status: 413 });
  try {
    const b = await call(business.uploadLogo, { body: { image: Buffer.from(bytes).toString("base64") } });
    return Response.json({ hasLogo: b.hasLogo, logoVersion: b.logoVersion });
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE() {
  try {
    await call(business.removeLogo);
    return Response.json({ hasLogo: false, logoVersion: null });
  } catch (err) {
    return fail(err);
  }
}
