import { books } from "@billingease/contracts";
import { ApiFailure, call } from "@/lib/api";
import { exportName } from "@/lib/export";
import { balanceSheetCsv, profitAndLossCsv } from "@/lib/report-csv";
import { requireBusiness } from "@/lib/session";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Reports → Export CSV: the profit and loss for a range, or the balance sheet on a date. */
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const pick = (k: string) => (DATE.test(p.get(k) ?? "") ? p.get(k)! : undefined);
  const { business } = await requireBusiness();
  try {
    let csv: string, name: string;
    if (p.get("report") === "balance-sheet") {
      const bs = await call(books.balanceSheet, { query: { at: pick("at") } });
      csv = balanceSheetCsv(bs, business.currency);
      name = exportName(business.name, "balance-sheet", bs.at);
    } else {
      const pl = await call(books.profitAndLoss, { query: { from: pick("from"), to: pick("to") } });
      csv = profitAndLossCsv(pl, business.currency);
      name = exportName(business.name, `profit-and-loss-${pl.from}`, pl.to);
    }
    return new Response("﻿" + csv, {
      headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}"`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" },
    });
  } catch (err) {
    if (err instanceof ApiFailure) return new Response(err.message, { status: err.status, headers: { "content-type": "text/plain; charset=utf-8" } });
    throw err;
  }
}
