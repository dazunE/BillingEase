import { today } from "@billingease/core";
import { ApiFailure } from "@/lib/api";
import { buildExport, exportName, EXPORTS, type ExportKind } from "@/lib/export";
import { requireBusiness } from "@/lib/session";

/** Security and data → Take your data out: one CSV, built from the books right now. */
export async function GET(_request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!EXPORTS.includes(kind as ExportKind)) return new Response("Not found", { status: 404 });
  const { business } = await requireBusiness();
  try {
    const { csv } = await buildExport(kind as ExportKind, business.currency);
    return new Response("﻿" + csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${exportName(business.name, kind as ExportKind, today())}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (err) {
    if (err instanceof ApiFailure) return new Response(err.message, { status: err.status, headers: { "content-type": "text/plain; charset=utf-8" } });
    throw err;
  }
}
