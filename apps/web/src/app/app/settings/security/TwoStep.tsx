"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge, Button, cx, Icon, ICONS } from "@/components/ui";
import { disableTwoStep, enableTwoStep, makeBackupCodes, startTwoStep } from "./actions";

type Mode = "idle" | "scan" | "codes" | "renew" | "off";

const codeInput =
  "min-h-12 w-full max-w-[220px] rounded-[10px] border bg-white px-3.5 text-center font-display text-xl font-bold tracking-[0.25em] tabular-nums text-ink focus:outline-2 focus:outline-offset-1 focus:outline-coming";

/** Space the key in fours, so it can be typed into an app by hand. */
const grouped = (secret: string) => secret.replace(/(.{4})/g, "$1 ").trim();

/**
 * Two-step sign-in with an authenticator app: connect the app (scan, then a code to prove it
 * works), save the ten backup codes, and later make new codes or turn it off (each with a code).
 */
export function TwoStep({ on, since, backupLeft, email }: { on: boolean; since: string | null; backupLeft: number; email: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const reset = () => { setMode("idle"); setSetup(null); setCodes(null); setError(null); };

  const begin = () => start(async () => {
    setError(null);
    const r = await startTwoStep();
    if (r?.error || !r?.secret || !r.qr) { setError(r?.error ?? "Something went wrong. Try again."); return; }
    setSetup({ secret: r.secret, qr: r.qr });
    setMode("scan");
  });

  const submit = (fn: typeof enableTwoStep, fd: FormData, after?: () => void) => start(async () => {
    setError(null);
    const r = await fn(undefined, fd);
    if (r?.error) { setError(r.error); return; }
    if (r?.codes) { setCodes(r.codes); setMode("codes"); return; }
    after?.();
  });

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      setCopied(null);
    }
  };

  const download = (list: string[]) => {
    const text = `BillingEase backup codes for ${email}\nEach code works once. Keep them somewhere safe.\n\n${list.join("\n")}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "billingease-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const sub = on
    ? `On since ${since ? new Date(since).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "today"} · ${backupLeft} backup ${backupLeft === 1 ? "code" : "codes"} left`
    : "Off. Adds a code from an app on your phone each time you sign in.";

  const errorLine = error && (
    <span role="alert" className="flex items-center gap-1.5 text-[13px] font-semibold text-late">
      <Icon d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v5M12 16.5v.01" size={16} strokeWidth={2.2} />{error}
    </span>
  );

  return (
    <li className="flex flex-col gap-4 border-t border-divider py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="font-semibold">Two-step sign-in</span>
          <span className="text-[13px] text-muted">{sub}</span>
        </span>
        <span className="flex flex-wrap items-center gap-2">
          {on ? <Badge tone="pos">On</Badge> : <Badge tone="neutral">Off</Badge>}
          {!on && mode === "idle" && <Button onClick={begin} disabled={pending} className="min-h-10 px-4 text-sm">{pending ? "Starting…" : "Turn on"}</Button>}
          {on && mode === "idle" && (
            <>
              <Button variant="secondary" onClick={() => { setError(null); setMode("renew"); }} className="min-h-10 px-4 text-sm">Backup codes</Button>
              <Button variant="secondary" onClick={() => { setError(null); setMode("off"); }} className="min-h-10 px-4 text-sm">Turn off</Button>
            </>
          )}
        </span>
      </div>
      {mode === "idle" && errorLine}

      {mode === "scan" && setup && (
        <form
          action={(fd) => submit(enableTwoStep, fd)}
          className="flex flex-col gap-4 rounded-[20px] bg-bg p-[clamp(14px,2.5vw,20px)]"
        >
          <span className="text-[13px] font-bold text-ink2">Step 1 of 2 · Connect an authenticator app</span>
          <div className="flex flex-wrap items-start gap-5">
            <span
              role="img"
              aria-label="QR code for your authenticator app"
              className="block size-[168px] shrink-0 rounded-2xl border border-line bg-white p-3 [&>svg]:size-full"
              dangerouslySetInnerHTML={{ __html: setup.qr }}
            />
            <ol className="flex min-w-[220px] flex-1 list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-ink2">
              <li>Open an authenticator app like 1Password, Google Authenticator or Authy.</li>
              <li>
                Scan this code. Can&apos;t scan? Type the key:{" "}
                <code className="whitespace-nowrap rounded-md bg-white px-1.5 py-0.5 font-mono text-[13px] font-semibold text-ink">{grouped(setup.secret)}</code>{" "}
                <button type="button" onClick={() => copy(setup.secret, "key")} className="text-[13px] font-semibold text-ink underline underline-offset-2">
                  {copied === "key" ? "Copied" : "Copy"}
                </button>
              </li>
              <li>Enter the 6-digit code it shows.</li>
            </ol>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold">6-digit code</span>
            <input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required aria-invalid={error ? true : undefined}
              className={cx(codeInput, error ? "border-late" : "border-input")} />
          </label>
          {errorLine}
          <span className="flex flex-wrap gap-2">
            <Button disabled={pending}>{pending ? "Checking…" : "Verify and continue"}</Button>
            <Button type="button" variant="secondary" onClick={reset}>Cancel</Button>
          </span>
        </form>
      )}

      {mode === "codes" && codes && (
        <div className="flex flex-col gap-4 rounded-[20px] bg-bg p-[clamp(14px,2.5vw,20px)]">
          <span className="text-[13px] font-bold text-ink2">{on && !setup ? "New backup codes" : "Step 2 of 2 · Save your backup codes"}</span>
          <p className="text-sm leading-relaxed text-ink2">
            If you lose your phone, each of these codes gets you in once. Keep them somewhere safe, like a password manager.
            We won&apos;t show them again: you can make new ones any time with a code from your app.
          </p>
          <ul aria-label="Backup codes" className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
            {codes.map((c) => (
              <li key={c} className="rounded-xl border border-line bg-white px-3 py-2 text-center font-mono text-[15px] font-semibold tracking-wider">{c}</li>
            ))}
          </ul>
          <span className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => copy(codes.join("\n"), "codes")} className="min-h-10 px-4 text-sm">
              {copied === "codes" ? "Copied" : "Copy codes"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => download(codes)} className="min-h-10 px-4 text-sm">
              <Icon d={ICONS.download} size={16} />Download .txt
            </Button>
            <Button type="button" onClick={() => { reset(); router.refresh(); }} className="min-h-10 px-4 text-sm">
              {setup ? "I saved them, finish" : "Done"}
            </Button>
          </span>
        </div>
      )}

      {(mode === "renew" || mode === "off") && (
        <form
          action={(fd) => submit(mode === "renew" ? makeBackupCodes : disableTwoStep, fd, () => { reset(); router.refresh(); })}
          className={cx("flex flex-col gap-3 rounded-[20px] p-[clamp(14px,2.5vw,20px)]", mode === "off" ? "bg-late-bg" : "bg-bg")}
        >
          <span className={cx("text-sm font-semibold", mode === "off" && "text-late")}>
            {mode === "renew"
              ? "Enter a code from your app to make 10 new backup codes. The old ones stop working."
              : "Turning it off means your password alone gets into your books. Enter a code from your app, or a backup code."}
          </span>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold">{mode === "renew" ? "6-digit code" : "Code from your app or a backup code"}</span>
            <input name="code" autoComplete="one-time-code" maxLength={mode === "renew" ? 7 : 9} required aria-invalid={error ? true : undefined}
              inputMode={mode === "renew" ? "numeric" : "text"} className={cx(codeInput, "max-w-[260px]", error ? "border-late" : "border-input")} />
          </label>
          {errorLine}
          <span className="flex flex-wrap gap-2">
            {mode === "off" ? (
              <button disabled={pending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#A8200D] px-5 text-sm font-semibold text-white hover:bg-[#8f1b0b] disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted">{pending ? "Checking…" : "Turn off two-step sign-in"}</button>
            ) : (
              <Button disabled={pending}>{pending ? "Checking…" : "Make new codes"}</Button>
            )}
            {mode === "off" ? (
              <button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-ink hover:bg-white/80">Keep it on</button>
            ) : (
              <Button type="button" variant="secondary" onClick={reset}>Cancel</Button>
            )}
          </span>
        </form>
      )}
    </li>
  );
}
