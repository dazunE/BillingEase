"use client";

import Link from "next/link";
import { useState } from "react";
import { cx, Icon, ICONS } from "@/components/ui";

export type Area = "start" | "in" | "out" | "keep" | "biz";
export type Answer = { id: string; g: Area; q: string; kw: string; body: string[]; links: [string, string][]; live?: boolean };
type Numbers = { in: string; out: string; profit: string; tax: string; keep: string; label: string } | null;

const AREAS: Record<Area, { label: string; dot: string }> = {
  start: { label: "Basics", dot: "bg-violet" },
  in: { label: "Coming in", dot: "bg-coming" },
  out: { label: "Going out", dot: "bg-going" },
  keep: { label: "Tax and your books", dot: "bg-ink border-2 border-violet" },
  biz: { label: "Your business", dot: "bg-input" },
};

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const field = "min-h-11 w-full rounded-[10px] border bg-white px-3 text-[15px] font-normal text-ink focus:outline-2 focus:outline-offset-1 focus:outline-coming";

/**
 * The Help page's moving parts (prototype Help): search and topics over the answers, each opening
 * in place with links to where you do it, and Talk to a person, which writes an email to us.
 */
export function HelpView({ first, answers, numbers, searchHint, topicOptions, helpEmail, name, email, business }: {
  first: string; answers: Answer[]; numbers: Numbers; searchHint: string; topicOptions: string[]; helpEmail: string; name: string; email: string; business: string;
}) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<"all" | Area>("all");
  const [open, setOpen] = useState<Record<string, boolean>>({ numbers: true });
  const [f, setF] = useState({ name, email, topic: topicOptions[0], msg: "" });
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const match = (a: Answer) => words.every((w) => `${a.q} ${a.kw} ${a.body.join(" ")}`.toLowerCase().includes(w));
  const list = answers.filter((a) => (topic === "all" || a.g === topic) && match(a));
  const isOpen = (id: string) => (words.length ? open[id] !== false && (list.length <= 2 || !!open[id]) : !!open[id]);
  const status = words.length ? `${list.length} ${list.length === 1 ? "answer" : "answers"} for “${query.trim()}”` : `${list.length} common questions`;

  const emailOk = EMAIL_OK.test(f.email.trim());
  const msgOk = f.msg.trim().length >= 10;
  const emailErr = tried && !emailOk ? (f.email.trim() ? "That email doesn’t look right." : "Add an email so we can reply.") : null;
  const msgErr = tried && !msgOk ? "Tell us a little more (at least a sentence)." : null;
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  function send() {
    if (!emailOk || !msgOk) { setTried(true); return; }
    const subject = `${f.topic}: ${business}`;
    const body = `${f.msg.trim()}\n\n${f.name}\n${f.email.trim()}\n${business}`;
    window.location.href = `mailto:${helpEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(f.email.trim());
    setTried(false);
  }

  const topics: { id: "all" | Area; label: string; dot: string }[] = [{ id: "all", label: "All", dot: "" }, ...(Object.keys(AREAS) as Area[]).map((k) => ({ id: k, ...AREAS[k] }))];

  return (
    <>
      <section aria-labelledby="help-h" className="flex flex-col gap-4">
        <div className="flex max-w-[720px] flex-col gap-2">
          <h1 id="help-h" className="font-display text-[clamp(30px,4vw,44px)] font-bold leading-[1.1] tracking-[-0.03em]">How can we help, {first}?</h1>
          <p className="text-base leading-normal text-ink2">Short answers about using BillingEase, each with a link to the place where you do it. For tax questions, try <Link href="/app/ask" className="font-semibold underline underline-offset-2">Ask</Link>.</p>
        </div>
        <label className="box-border flex min-h-[52px] max-w-[720px] items-center gap-2.5 rounded-full border border-input bg-white pl-[18px] pr-2 focus-within:border-ink">
          <Icon d={ICONS.search} className="shrink-0 text-ink2" />
          <span className="sr-only">Search help</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchHint}
            className="min-h-11 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted/80 [&::-webkit-search-cancel-button]:appearance-none" />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface">
              <Icon d="M6 6l12 12M18 6 6 18" size={16} strokeWidth={2.4} />
            </button>
          )}
        </label>
        <div role="group" aria-label="Topics" className="flex flex-wrap gap-1.5">
          {topics.map((t) => {
            const on = topic === t.id;
            return (
              <button key={t.id} type="button" aria-pressed={on} onClick={() => setTopic(t.id)}
                className={cx("inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold", on ? "border-ink bg-ink text-white" : "border-input bg-white text-ink hover:bg-bg")}>
                <span aria-hidden className={cx("box-border size-2 rounded-full", t.id === "all" ? (on ? "bg-violet" : "bg-ink") : t.dot.replace("border-2", "border"))} />
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <section aria-labelledby="ans-h" className="flex min-w-0 flex-[999_1_520px] flex-col gap-3">
          <h2 id="ans-h" aria-live="polite" className="text-sm font-semibold text-muted">{status}</h2>
          {list.length > 0 ? (
            <div className="flex flex-col gap-0.5 rounded-3xl border border-line bg-white p-2">
              {list.map((a) => {
                const o = isOpen(a.id);
                const ar = AREAS[a.g];
                return (
                  <div key={a.id} className={cx("rounded-2xl", o && "bg-bg")}>
                    <button type="button" aria-expanded={o} onClick={() => setOpen({ ...open, [a.id]: !o })}
                      className="flex min-h-[60px] w-full items-center gap-3.5 rounded-2xl px-3.5 py-2.5 text-left hover:bg-bg">
                      <span aria-hidden className={cx("box-border size-2.5 shrink-0 rounded-full", ar.dot)} />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-base font-bold leading-[1.35]">{a.q}</span>
                        <span className="text-[13px] text-muted">{ar.label}</span>
                      </span>
                      <Icon d={o ? "m6 15 6-6 6 6" : ICONS.chevronDown} size={18} strokeWidth={2.2} className="shrink-0" />
                    </button>
                    {o && (
                      <div className="flex flex-col gap-2.5 pb-[18px] pl-[38px] pr-[18px] max-sm:pl-[18px]">
                        {a.body.map((p, i) => <p key={i} className="text-[15px] leading-[1.55] text-[#2E2B36]">{p}</p>)}
                        {a.live && numbers && (
                          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-line bg-white px-3.5 py-3 text-[13.5px] font-semibold tabular-nums">
                            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-coming" />{numbers.in}</span>
                            <span aria-hidden className="text-muted">−</span>
                            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-going" />{numbers.out}</span>
                            <span aria-hidden className="text-muted">=</span>
                            <span>{numbers.profit} profit</span>
                            <span aria-hidden className="text-muted">−</span>
                            <span>{numbers.tax} for tax</span>
                            <span aria-hidden className="text-muted">=</span>
                            <span className="rounded-full bg-ink px-2.5 py-0.5 text-violet">{numbers.keep} yours to keep</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {a.links.map(([label, href], i) => (
                            <Link key={href + label} href={href} className={cx("inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-ink no-underline", i === 0 ? "bg-violet hover:bg-[#a98ffb]" : "bg-ink/[0.07] hover:bg-ink/[0.11]")}>
                              {label}<Icon d={ICONS.arrowRight} size={16} strokeWidth={2.2} />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5 rounded-3xl border border-line bg-white px-6 py-7 text-center">
              <span className="font-display text-xl font-bold tracking-[-0.02em]">No answer for “{query.trim()}” yet</span>
              <span className="max-w-[440px] text-[15px] leading-normal text-ink2">Ask a person and we&apos;ll write back, or look through every feature.</span>
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={() => { setF({ ...f, msg: f.msg || `I was looking for help with “${query.trim()}”. ` }); setSent(null); document.getElementById("ask-msg")?.focus(); }}
                  className="min-h-11 rounded-full bg-violet px-5 text-sm font-semibold text-ink hover:bg-[#a98ffb]">Ask a person about this</button>
                <Link href="/app/everything" className="inline-flex min-h-11 items-center rounded-full bg-ink/[0.07] px-[18px] text-sm font-semibold text-ink no-underline hover:bg-ink/[0.11]">See everything BillingEase does</Link>
              </div>
            </div>
          )}
          <p className="mt-1 text-sm text-ink2">Looking for a feature rather than an answer? <Link href="/app/everything" className="font-semibold text-ink underline underline-offset-2">Everything BillingEase does</Link> lists them all in plain words.</p>
        </section>

        <section aria-labelledby="ask-h" className="flex min-w-0 flex-[1_1_320px] flex-col gap-3.5 rounded-3xl border border-line bg-white p-[22px]">
          <div className="flex flex-col gap-1">
            <h2 id="ask-h" className="font-display text-xl font-bold tracking-[-0.02em]">Talk to a person</h2>
            <span className="text-sm leading-[1.45] text-ink2">A real person reads every question. We usually reply within one working day.</span>
          </div>
          {sent ? (
            <div role="status" className="flex flex-col gap-2.5 rounded-2xl bg-pos-bg p-4 text-pos">
              <span className="flex items-center gap-2 text-[15px] font-bold"><Icon d={ICONS.check} size={18} strokeWidth={2.6} />Your email is ready to send</span>
              <span className="text-sm leading-[1.45]">Your email app opened with your question to {helpEmail}. Send it from there and we&apos;ll reply to {sent}. Nothing opened? Write to <a href={`mailto:${helpEmail}`} className="font-semibold underline">{helpEmail}</a>.</span>
              <button type="button" onClick={() => setSent(null)} className="min-h-8 self-start text-sm font-semibold underline">Ask something else</button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Your name
                <input type="text" value={f.name} onChange={set("name")} autoComplete="name" className={cx(field, "border-input")} />
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Email for the reply
                <input type="email" value={f.email} onChange={set("email")} autoComplete="email" aria-invalid={!!emailErr} className={cx(field, emailErr ? "border-late" : "border-input")} />
                {emailErr && <span className="text-[13px] font-semibold text-late">{emailErr}</span>}
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold">What it&apos;s about
                <select value={f.topic} onChange={set("topic")} className={cx(field, "border-input px-2.5")}>
                  {topicOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold">Your question
                <textarea id="ask-msg" rows={5} value={f.msg} onChange={set("msg")} aria-invalid={!!msgErr} placeholder="Tell us what you were trying to do and what happened."
                  className={cx(field, "resize-y py-2.5", msgErr ? "border-late" : "border-input")} />
                {msgErr && <span className="text-[13px] font-semibold text-late">{msgErr}</span>}
              </label>
              <button type="button" onClick={send} className="min-h-[46px] self-start rounded-full bg-violet px-[22px] text-[15px] font-semibold text-ink hover:bg-[#a98ffb]">Send question</button>
              <span className="text-[12.5px] leading-[1.45] text-muted">This opens your email app, addressed to <a href={`mailto:${helpEmail}`} className="font-semibold text-ink underline">{helpEmail}</a>. We never ask for your password.</span>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
