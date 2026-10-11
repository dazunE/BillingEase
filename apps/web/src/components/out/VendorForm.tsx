"use client";

import { useState, useTransition, type FormEvent } from "react";
import { addVendorAction, type FormState } from "@/app/app/out/actions";
import { Button, Field, Input, cx } from "@/components/ui";

export function VendorForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<FormState | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setResult(null);
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Add the vendor's name.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "That email address doesn't look right.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const fd = new FormData(ev.currentTarget);
    startTransition(async () => {
      const r = await addVendorAction({ ok: false }, fd);
      setResult(r);
      setErrors(r.errors ?? {});
      if (r.ok) {
        setName("");
        setEmail("");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5">
      <Field label="Name" error={errors.name}>
        <Input name="name" placeholder="e.g. Local Print Shop" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
      </Field>
      <Field label="Email (optional)" error={errors.email}>
        <Input name="email" type="email" placeholder="billing@vendor.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} />
      </Field>
      <Button type="submit" variant="dark" disabled={pending} className="self-start">
        {pending ? "Adding…" : "Add vendor"}
      </Button>
      {result?.message && (
        <p role={result.ok ? "status" : "alert"} className={cx("text-sm font-semibold", result.ok ? "text-pos" : "text-late")}>
          {result.message}
        </p>
      )}
    </form>
  );
}
