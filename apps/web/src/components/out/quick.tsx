"use client";

import type { FileAttachment, OutCategory } from "@billingease/contracts";
import { formatDate } from "@billingease/core";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition, type ReactNode } from "react";
import { categoriseExpense, deleteAttachment, markBillPaid } from "@/app/app/out/actions";
import { Button, ICONS, Icon, Input, Select, cx } from "@/components/ui";
import type { FormState } from "@/lib/form";
import { fileIcon, fileSize } from "./bits";
import { uploadFile } from "./fields";

type Action = (s: FormState, fd: FormData) => Promise<FormState>;

/** A one-button form (delete, void, pause...) that shows the API's answer. */
export function ActionButton({ action, fields, children, variant = "secondary", confirm, className, done }: {
  action: Action; fields: Record<string, string>; children: ReactNode; variant?: "primary" | "secondary" | "outline" | "dark" | "ghost" | "danger"; confirm?: string; className?: string; done?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={cx("flex flex-col gap-1", className)} onSubmit={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}>
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <Button variant={variant === "danger" ? "outline" : variant} disabled={pending} className={cx(variant === "danger" && "border-late text-late hover:bg-late-bg")}>{pending ? "…" : children}</Button>
      {state?.message && !state.ok && <span role="alert" className="text-xs font-semibold text-late">{state.message}</span>}
      {state?.ok && done && <span role="status" className="text-xs font-semibold text-pos">{done}</span>}
    </form>
  );
}

/** Pick a category for an expense waiting to be sorted. */
export function QuickSort({ id, categories }: { id: string; categories: OutCategory[] }) {
  const [state, action, pending] = useActionState(categoriseExpense, undefined);
  const groups = [...new Set(categories.map((c) => c.scope))];
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`cat-${id}`}>Category</label>
      <Select id={`cat-${id}`} name="categoryId" defaultValue="" className="w-auto min-w-0 max-w-[240px] flex-1">
        <option value="" disabled>Pick a category</option>
        {groups.length > 1
          ? groups.map((g) => <optgroup key={g} label={g === "property" ? "Property" : "Business"}>{categories.filter((c) => c.scope === g).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>)
          : categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      <Button disabled={pending} className="min-h-11 px-4">{pending ? "…" : "Sort"}</Button>
      {state?.message && !state.ok && <span role="alert" className="w-full text-xs font-semibold text-late">{state.message}</span>}
    </form>
  );
}

/** Mark a bill paid from a list: what's left, today, by the method picked. */
export function QuickPay({ id, left, methods, label = "Mark paid" }: { id: string; left: number; methods: string[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState(methods[0]);
  const [state, action, pending] = useActionState(markBillPaid, undefined);
  const cheque = method.toLowerCase() === "cheque";
  if (!open) return <Button type="button" onClick={() => setOpen(true)} className="min-h-11 px-4">{label}</Button>;
  return (
    <form action={action} className="flex flex-wrap items-center justify-end gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="amount" value={left} />
      <label className="sr-only" htmlFor={`m-${id}`}>Paid with</label>
      <Select id={`m-${id}`} name="method" value={method} onChange={(e) => setMethod(e.target.value)} className="w-auto">
        {methods.map((m) => <option key={m}>{m}</option>)}
      </Select>
      {cheque && <Input name="chequeNumber" placeholder="Cheque no." aria-label="Cheque number" className="w-32" />}
      <Button disabled={pending} className="min-h-11 px-4">{pending ? "…" : "Paid today"}</Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      {state?.message && !state.ok && <span role="alert" className="w-full text-right text-xs font-semibold text-late">{state.message}</span>}
    </form>
  );
}

/** Photos and PDFs on an expense or bill: open, download, remove, add another. */
export function AttachmentList({ ownerType, ownerId, files, hint }: { ownerType: "expense" | "bill"; ownerId: string; files: FileAttachment[]; hint: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [key, setKey] = useState(0);
  const add = (file: File | undefined) => {
    if (!file) return;
    start(async () => {
      setError(await uploadFile(ownerType, ownerId, file));
      setKey((k) => k + 1);
      router.refresh();
    });
  };
  return (
    <div className="flex flex-col gap-3">
      {files.map((f) => (
        <div key={f.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line p-3.5">
          <span className={cx("flex size-11 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold", f.mime === "application/pdf" ? "bg-late-bg text-late" : "bg-info-bg text-info")}>{fileIcon(f.mime)}</span>
          <span className="flex min-w-0 flex-1 flex-col">
            <a href={`/app/out/attachments/${f.id}`} target="_blank" rel="noopener" className="truncate font-bold hover:underline">{f.filename}</a>
            <span className="text-xs text-muted">{fileSize(f.size)} · added {formatDate(f.createdAt.slice(0, 10))} · {hint}</span>
          </span>
          <a href={`/app/out/attachments/${f.id}?download=1`} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-ink/[0.07] px-4 text-sm font-semibold hover:bg-ink/[0.11]" download>
            <Icon d={ICONS.download} size={16} /> Download
          </a>
          <ActionButton action={deleteAttachment} fields={{ id: f.id }} variant="ghost" confirm={`Remove ${f.filename}?`}>Remove</ActionButton>
        </div>
      ))}
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 self-start rounded-full bg-ink/[0.07] px-4 text-sm font-semibold hover:bg-ink/[0.11] has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-coming">
        <Icon d={ICONS.plus} size={16} />
        {pending ? "Uploading…" : files.length ? "Attach another" : "Attach a photo or PDF"}
        <input key={key} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,application/pdf" className="sr-only" disabled={pending} onChange={(e) => add(e.target.files?.[0])} />
      </label>
      {error && <p role="alert" className="text-sm font-semibold text-late">{error}</p>}
    </div>
  );
}
