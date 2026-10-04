import "server-only";

/**
 * A PDF file response. Downloads by default; `?view=1` opens it in the
 * browser's PDF viewer instead.
 */
export function pdfResponse(bytes: Uint8Array, filename: string, request: Request) {
  const view = new URL(request.url).searchParams.get("view") === "1";
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${view ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
