import { payroll } from "@billingease/contracts";
import { ApiFailure, call } from "@/lib/api";
import { exportName } from "@/lib/export";
import { SCHEDULES, scheduleTable, tableCsv, type ScheduleKind } from "@/lib/payroll-tables";
import { requireBusiness } from "@/lib/session";

/** Payroll → a Sri Lankan run → one schedule (EPF, ETF, APIT or the bank transfer list) as CSV. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params;
  if (!SCHEDULES.includes(kind as ScheduleKind)) return new Response("Not found", { status: 404 });
  const { business } = await requireBusiness();
  try {
    const s = await call(payroll.schedules, { params: { id } });
    const t = scheduleTable(kind as ScheduleKind, s);
    return new Response("﻿" + tableCsv(t), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${exportName(business.name, kind === "bank" ? "bank-transfers" : kind, s.month)}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (err) {
    if (err instanceof ApiFailure) return new Response(err.message, { status: err.status, headers: { "content-type": "text/plain; charset=utf-8" } });
    throw err;
  }
}
