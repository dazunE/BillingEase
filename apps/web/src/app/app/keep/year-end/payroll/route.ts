import { books } from "@billingease/contracts";
import { addDays, rulesFor, today } from "@billingease/core";
import { ApiFailure, call } from "@/lib/api";
import { exportName } from "@/lib/export";
import { payrollYearTable, tableCsv } from "@/lib/payroll-tables";
import { requireBusiness } from "@/lib/session";

/** Tax and year-end → payroll for the year, per person, as CSV. `?year=last` for last year. */
export async function GET(request: Request) {
  const { business } = await requireBusiness();
  const last = new URL(request.url).searchParams.get("year") === "last";
  const rules = rulesFor(business.country);
  const date = last ? rules.taxYearOf(addDays(rules.taxYearOf(today()).from, -1)).from : undefined;
  try {
    const r = await call(books.yearEnd, { query: { date } });
    if (!r.payroll) return new Response("No payroll in this year.", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
    const t = payrollYearTable(r.payroll, r.taxYear.label);
    return new Response("﻿" + tableCsv(t), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${exportName(business.name, t.file, r.taxYear.to)}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (err) {
    if (err instanceof ApiFailure) return new Response(err.message, { status: err.status, headers: { "content-type": "text/plain; charset=utf-8" } });
    throw err;
  }
}
