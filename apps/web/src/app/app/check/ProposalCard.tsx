"use client";

import type { Proposal } from "@billingease/contracts";
import { currencySymbol, formatMoney, type Currency } from "@billingease/core";
import { useActionState, useState } from "react";
import { Badge, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { approveProposal, rejectProposal } from "./actions";

const amount = (minor: unknown) => (typeof minor === "number" ? (minor / 100).toFixed(2).replace(/\.00$/, "") : "");

/** One thing an agent wants to do: what it read, what it would add, and Approve or Turn down. */
export function ProposalCard({ p, currency, categories }: { p: Proposal; currency: Currency; categories: { id: string; name: string }[] }) {
  const [approved, approve, approving] = useActionState(approveProposal, undefined);
  const [rejected, reject, rejecting] = useActionState(rejectProposal, undefined);
  const [declining, setDeclining] = useState(false);
  const busy = approving || rejecting;
  const v = approved?.values ?? {};
  const e = approved?.errors ?? {};
  const pay = p.payload as Record<string, unknown>;
  const conf = p.confidence;

  return (
    <li className="flex flex-col gap-4 rounded-[20px] border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-semibold text-muted">{p.agentName} suggests</span>
          <span className="font-display text-lg font-bold">{p.title}</span>
          <span className="text-sm text-ink2">{p.summary}</span>
        </div>
        {conf != null && <Badge tone={conf >= 85 ? "pos" : conf >= 60 ? "due" : "late"}>{conf >= 85 ? "Sure" : conf >= 60 ? "Fairly sure" : "Not sure"} · {conf}%</Badge>}
      </div>
      {p.sources.length > 0 && (
        <p className="flex flex-wrap gap-x-3 text-xs text-muted">
          <span>From:</span>
          {p.sources.map((s, i) => s.kind === "attachment" && s.id
            ? <a key={i} href={`/app/out/attachments/${s.id}`} target="_blank" rel="noreferrer" className="font-semibold text-ink underline underline-offset-2">{s.label} (open)</a>
            : <span key={i}>{s.label}{s.page ? ` (page ${s.page})` : ""}</span>)}
        </p>
      )}

      <form action={approve} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="id" value={p.id} />
        <input type="hidden" name="kind" value={p.kind} />
        {p.kind === "expense.create" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Paid on" error={e.spentOn}><Input type="date" name="spentOn" defaultValue={v.spentOn ?? String(pay.spentOn ?? "")} /></Field>
            <Field label="Paid to" error={e.payee}><Input name="payee" defaultValue={v.payee ?? String(pay.payee ?? "")} /></Field>
            <Field label={`Amount paid (${currencySymbol(currency)})`} error={e.gross}><Input name="gross" inputMode="decimal" defaultValue={v.gross ?? amount(pay.gross)} /></Field>
            {currency === "USD" ? (
              // No VAT in the US: sales tax is part of what was paid.
              <input type="hidden" name="vat" value="0" />
            ) : (
              <Field label={`VAT on the receipt (${currencySymbol(currency)})`} error={e.vat}><Input name="vat" inputMode="decimal" defaultValue={v.vat ?? amount(pay.vat ?? 0)} /></Field>
            )}
            <Field label="Category" error={e.categoryId} className="sm:col-span-2">
              <Select name="categoryId" defaultValue={v.categoryId ?? String(pay.categoryId ?? "")}>
                <option value="">Sort later</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          </div>
        ) : p.kind === "invoice.remind" ? (
          <Field label={pay.email ? "The email they'll get" : "The WhatsApp message"} error={e.message}>
            <Textarea name="message" rows={7} defaultValue={v.message ?? String(pay.message ?? "")} />
          </Field>
        ) : p.kind === "receipt.create" || p.kind === "bill_payment.create" ? (
          <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
            <dt className="text-muted">{p.kind === "receipt.create" ? "Received" : "Paid"}</dt>
            <dd>{formatMoney(Number(pay.amount ?? 0), currency)} on {String(pay.receivedOn ?? pay.paidOn ?? "")}</dd>
            <dt className="text-muted">How</dt><dd>{String(pay.method ?? "")}</dd>
            {pay.reference ? <><dt className="text-muted">Reference</dt><dd className="[overflow-wrap:anywhere]">{String(pay.reference)}</dd></> : null}
          </dl>
        ) : (
          <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
            <dt className="text-muted">From</dt><dd>{String(pay.supplierName ?? "Saved supplier")}</dd>
            <dt className="text-muted">Dated</dt><dd>{String(pay.billDate ?? "")} · due {String(pay.dueDate ?? "")}</dd>
            {Array.isArray(pay.lines) && (pay.lines as { description: string; net: number; vat?: number }[]).map((l, i) => (
              <div key={i} className="contents"><dt className="text-muted">Line {i + 1}</dt><dd>{l.description} · {formatMoney(l.net + (l.vat ?? 0), currency)}</dd></div>
            ))}
          </dl>
        )}
        {(approved?.message ?? p.error) && <p role="alert" className="text-sm font-semibold text-late">{approved?.message ?? `Last try: ${p.error} Change it and approve again, or turn it down.`}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={busy}>{approving ? "Working…" : p.kind === "invoice.remind" ? (pay.email ? "Approve and send" : "Approve") : p.kind === "receipt.create" || p.kind === "bill_payment.create" ? "Approve and record" : "Approve and add"}</Button>
          {!declining && <Button type="button" variant="secondary" disabled={busy} onClick={() => setDeclining(true)}>Turn down</Button>}
        </div>
      </form>

      {declining && (
        <form action={reject} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={p.id} />
          <Field label="Why? (optional)" className="min-w-[220px] flex-1"><Input name="reason" placeholder="e.g. a personal cost" /></Field>
          <Button type="submit" variant="dark" disabled={busy}>{rejecting ? "Turning down…" : "Turn it down"}</Button>
          {rejected?.message && <p role="alert" className="basis-full text-sm font-semibold text-late">{rejected.message}</p>}
        </form>
      )}
    </li>
  );
}
