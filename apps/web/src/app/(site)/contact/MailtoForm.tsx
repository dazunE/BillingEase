"use client";

import { useId, useState, type FormEvent } from "react";
import { cx } from "@/components/ui";

const field = "box-border min-h-12 w-full rounded-2xl border border-input bg-white px-4 text-base text-ink outline-none focus:border-ink";

/**
 * A message form that doesn't pretend to send anything: it writes the email
 * for you and opens it in your own email app, addressed to `to`. Nothing is
 * stored or sent by the site. The address is always shown, for people
 * without an email app.
 */
export function MailtoForm({
  to,
  topics,
  subjectPrefix,
  messageLabel = "What would you like to ask?",
  placeholder,
  extra,
  className,
}: {
  /** Default address; a topic may route elsewhere. */
  to: string;
  topics: { label: string; to?: string }[];
  subjectPrefix: string;
  messageLabel?: string;
  placeholder?: string;
  /** An optional extra line (e.g. "Business name"). */
  extra?: { label: string; placeholder?: string };
  className?: string;
}) {
  const id = useId();
  const [topic, setTopic] = useState(0);
  const [opened, setOpened] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const address = topics[topic]?.to ?? to;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const msg = String(f.get("message") ?? "").trim();
    const more = String(f.get("extra") ?? "").trim();
    if (!msg) {
      setError("Write a line or two first, so we know how to help.");
      return;
    }
    setError(null);
    const subject = `${subjectPrefix}: ${topics[topic]?.label ?? "Question"}`;
    const lines = [msg, ""];
    if (name) lines.push(`From: ${name}`);
    if (extra && more) lines.push(`${extra.label}: ${more}`);
    const body = lines.join("\n");
    window.location.href = `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.trim())}`;
    setOpened(address);
  };

  return (
    <form onSubmit={submit} noValidate className={cx("flex flex-col gap-4", className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5" htmlFor={`${id}-n`}>
          <span className="text-sm font-bold">Your name</span>
          <input id={`${id}-n`} name="name" autoComplete="name" className={field} />
        </label>
        <label className="flex flex-col gap-1.5" htmlFor={`${id}-t`}>
          <span className="text-sm font-bold">What’s it about?</span>
          <select id={`${id}-t`} value={topic} onChange={(e) => setTopic(Number(e.target.value))} className={cx(field, "appearance-auto pr-3")}>
            {topics.map((t, i) => (
              <option key={t.label} value={i}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {extra && (
        <label className="flex flex-col gap-1.5" htmlFor={`${id}-x`}>
          <span className="text-sm font-bold">
            {extra.label} <span className="font-normal text-muted">Optional</span>
          </span>
          <input id={`${id}-x`} name="extra" placeholder={extra.placeholder} className={field} />
        </label>
      )}
      <label className="flex flex-col gap-1.5" htmlFor={`${id}-m`}>
        <span className="text-sm font-bold">{messageLabel}</span>
        <textarea
          id={`${id}-m`}
          name="message"
          rows={5}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-h`}
          className={cx(field, "min-h-[132px] resize-y py-3 leading-normal")}
        />
        <span id={`${id}-h`} className={cx("text-[13px]", error ? "font-semibold text-late" : "text-muted")}>
          {error ?? "This opens your own email app with the message written. Nothing is sent until you press send there."}
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="submit" className="inline-flex min-h-12 items-center gap-2.5 rounded-full bg-ink px-6 text-[15px] font-bold text-white hover:bg-black">
          Write the email
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
        <span className="text-[13px] text-muted">
          Goes to <strong className="font-semibold text-ink">{address}</strong>
        </span>
      </div>
      {opened && (
        <p role="status" className="flex items-start gap-2.5 rounded-2xl bg-pos-bg px-4 py-3 text-[15px] font-semibold leading-normal text-pos">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 flex-none">
            <path d="m5 12 5 5 9-10" />
          </svg>
          <span>
            Your email app should now be open with the message ready to send. If nothing opened, write to <a href={`mailto:${opened}`} className="underline underline-offset-2">{opened}</a> and we’ll reply by email.
          </span>
        </p>
      )}
    </form>
  );
}
