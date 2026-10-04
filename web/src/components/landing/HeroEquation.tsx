"use client";

import { useState } from "react";
import { CashJar } from "@/components/CashJar";
import { cx } from "@/components/ui";
import { BIZ, BIZ_KEYS, dollars, L_ICONS } from "./data";
import s from "./landing.module.css";
import { useSample } from "./SampleProvider";

type Key = "in" | "out" | "keep";

const RING: Record<Key, string> = { in: "0 0 0 3px #7A5AF8", out: "0 0 0 3px #E0752D", keep: "0 0 0 3px #F7F6F9, 0 0 0 6px #7A5AF8" };
const pct = (a: number, t: number) => Math.max(2, Math.round((a / t) * 100));

function Chevron({ open, color = "#18161F" }: { open: boolean; color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={open ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} />
    </svg>
  );
}

/** The live sample equation: business switcher, the three numbers, and what sits behind the chosen one. */
export function HeroEquation() {
  const { biz, setBiz, b, n, roll } = useSample();
  const [open, setOpen] = useState<Key | null>(null);
  const toggle = (k: Key) => setOpen((o) => (o === k ? null : k));
  const hint = (k: Key) => (open === k ? "Showing what’s behind it" : "What’s behind this");
  const e = b.ex;
  const sc = b.scene;

  const panels = {
    in: {
      name: "Coming in",
      dot: "bg-coming",
      tint: "bg-tint",
      lead: "Getting paid, without chasing anyone.",
      items: [
        { icon: L_ICONS.doc, title: "Invoices in a sentence", tag: "Invoicing", ex: e.inv },
        { icon: L_ICONS.card, title: "Paid online", tag: "Card or bank transfer", ex: e.pay },
        { icon: L_ICONS.bell, title: "Reminders that send themselves", tag: "Automatic reminders", ex: e.rem },
      ],
    },
    out: {
      name: "Going out",
      dot: "bg-going",
      tint: "bg-going-tint",
      lead: "Every dollar out, sorted and on time.",
      items: [
        { icon: L_ICONS.bill, title: "Bills to pay", tag: "Bills and vendors", ex: e.bills },
        { icon: L_ICONS.cam, title: "Receipts, scanned", tag: "Snap or forward by email", ex: e.rcpt },
        { icon: L_ICONS.sort, title: "Card charges, sorted", tag: "Bank and card feeds", ex: e.cards },
        { icon: L_ICONS.people, title: "Payroll", tag: "Direct deposit and filings", ex: e.payroll },
      ],
    },
    keep: {
      name: "Yours to keep",
      dot: "bg-violet",
      tint: "bg-tint",
      lead: "What’s left after tax, so you can actually spend it.",
      items: [
        { icon: L_ICONS.safe, title: "Tax set aside for you", tag: "25% of profit, you can change it", ex: e.tax },
        { icon: L_ICONS.chart, title: "Reports for your accountant", tag: "The full books, one click away", ex: e.rep },
      ],
    },
  } as const;
  const panel = open ? panels[open] : null;

  const cardBase = cx(s.eqCard, "flex min-w-0 flex-[1_1_260px] cursor-pointer flex-col gap-3.5 rounded-3xl border p-[26px] text-left");
  const op = "flex flex-none items-center justify-center px-0.5 font-display text-[40px] font-bold text-muted max-[900px]:h-[22px] max-[900px]:basis-full max-[900px]:text-[28px]";

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2.5">
        <span id="biz-l" className="text-sm font-semibold text-muted">
          Try a business
        </span>
        <div role="group" aria-labelledby="biz-l" className="flex flex-wrap gap-1 rounded-full bg-surface p-1">
          {BIZ_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={biz === k}
              onClick={() => setBiz(k)}
              className={cx("min-h-10 rounded-full px-4 text-sm font-semibold", biz === k ? "bg-ink text-white" : "text-ink hover:bg-white")}
            >
              {BIZ[k].label}
            </button>
          ))}
        </div>
      </div>

      <div role="group" aria-label="Sample three numbers" className="flex flex-col gap-2.5">
        <span className="text-center text-[13px] text-muted">{b.caption}</span>
        <div className="flex flex-wrap items-stretch gap-3">
          <button type="button" aria-expanded={open === "in"} aria-controls="behind" onClick={() => toggle("in")} className={cx(cardBase, "border-line bg-white")} style={{ boxShadow: open === "in" ? RING.in : "none" }}>
            <span className="flex items-center gap-2 text-[15px] font-bold">
              <span className="size-2.5 rounded-full bg-coming" />
              Coming in
            </span>
            <span className="font-display text-[clamp(40px,4.6vw,60px)] font-bold leading-none tracking-[-0.035em] tabular">{roll(n.inT)}</span>
            <span className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-surface" aria-hidden>
              <span className="bg-coming" style={{ width: `${pct(b.inPaid, n.inT)}%` }} />
              <span className="bg-coming-light" style={{ width: `${100 - pct(b.inPaid, n.inT)}%` }} />
            </span>
            <span className="flex w-full flex-wrap justify-between gap-x-3 gap-y-1 text-[13px] text-ink2">
              <span>
                <strong className="text-ink">{dollars(b.inPaid)}</strong> received
              </span>
              <span>
                <strong className="text-ink">{dollars(b.inExp)}</strong> on the way
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-[13px] font-semibold">
              {hint("in")}
              <Chevron open={open === "in"} />
            </span>
          </button>
          <div aria-hidden className={op}>
            −
          </div>
          <button type="button" aria-expanded={open === "out"} aria-controls="behind" onClick={() => toggle("out")} className={cx(cardBase, "border-line bg-white")} style={{ boxShadow: open === "out" ? RING.out : "none" }}>
            <span className="flex items-center gap-2 text-[15px] font-bold">
              <span className="size-2.5 rounded-full bg-going" />
              Going out
            </span>
            <span className="font-display text-[clamp(40px,4.6vw,60px)] font-bold leading-none tracking-[-0.035em] tabular">{roll(n.outT)}</span>
            <span className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-surface" aria-hidden>
              <span className="bg-going" style={{ width: `${pct(b.outPaid, n.outT)}%` }} />
              <span className="bg-going-light" style={{ width: `${100 - pct(b.outPaid, n.outT)}%` }} />
            </span>
            <span className="flex w-full flex-wrap justify-between gap-x-3 gap-y-1 text-[13px] text-ink2">
              <span>
                <strong className="text-ink">{dollars(b.outPaid)}</strong> paid
              </span>
              <span>
                <strong className="text-ink">{dollars(b.outSch)}</strong> still to pay
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-[13px] font-semibold">
              {hint("out")}
              <Chevron open={open === "out"} />
            </span>
          </button>
          <div aria-hidden className={op}>
            =
          </div>
          <button type="button" aria-expanded={open === "keep"} aria-controls="behind" onClick={() => toggle("keep")} className={cx(cardBase, "border-ink bg-ink text-white")} style={{ boxShadow: open === "keep" ? RING.keep : "none" }}>
            <span className="flex items-center gap-2 text-[15px] font-bold text-tint">
              <span className="size-2.5 rounded-full bg-violet" />
              Yours to keep
            </span>
            <span className="font-display text-[clamp(40px,4.6vw,60px)] font-bold leading-none tracking-[-0.035em] text-violet tabular">{roll(n.keep)}</span>
            <span className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-tint/15" aria-hidden>
              <span className="bg-violet" style={{ width: `${pct(n.keep, n.profit)}%` }} />
              <span className="bg-tint/45" style={{ width: `${100 - pct(n.keep, n.profit)}%` }} />
            </span>
            <span className="text-[13px] text-tint">
              after <strong className="text-white">{dollars(n.tax)}</strong> set aside for tax
            </span>
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-tint">
              {hint("keep")}
              <Chevron open={open === "keep"} color="#EEE8FF" />
            </span>
          </button>
        </div>
      </div>

      <div id="behind" aria-live="polite">
        {panel && open ? (
          <div className="flex flex-col gap-[22px] rounded-3xl border border-line bg-white p-[clamp(20px,3vw,32px)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="flex items-center gap-2 text-[13px] font-bold text-muted">
                  <span className={cx("size-2.5 rounded-full", panel.dot)} />
                  Behind {panel.name}
                </span>
                <h2 className="font-display text-[clamp(20px,2.2vw,26px)] font-bold leading-tight tracking-[-0.02em]">{panel.lead}</h2>
              </div>
              <button type="button" aria-label="Close" onClick={() => setOpen(null)} className="flex size-10 flex-none items-center justify-center rounded-full bg-ink/[0.07] hover:bg-ink/[0.11]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div aria-hidden className={cx(s.anim, "box-border flex min-h-[170px] flex-wrap items-center justify-center gap-[18px] rounded-[20px] bg-bg p-5")}>
              {open === "in" && (
                <>
                  <span className="box-border flex h-11 max-w-full items-center rounded-full border border-line bg-white px-4 text-sm text-ink2">
                    <span className={cx(s.type5, "inline-block max-w-[340px] overflow-hidden whitespace-nowrap")}>{sc.sentence}</span>
                    <span className={cx(s.caret, "ml-0.5 h-[18px] w-0.5 bg-coming")} />
                  </span>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5F5B68" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                  <span className={cx(s.paper, "relative box-border flex h-32 w-[150px] flex-col gap-2 rounded-xl border border-line bg-white p-3.5")}>
                    <span className="flex justify-between text-[10px] font-bold">
                      <span>INVOICE</span>
                      <span className="text-muted">{sc.inv}</span>
                    </span>
                    <span className="h-1.5 w-4/5 rounded bg-surface" />
                    <span className="h-1.5 w-3/5 rounded bg-surface" />
                    <span className="mt-auto font-display text-lg font-bold">{sc.amt}</span>
                    <span
                      className={cx(s.stamp, "absolute right-2 top-10 rounded-lg border-[3px] border-pos bg-pos-bg/85 px-2.5 py-1 font-display text-lg font-extrabold tracking-[0.06em] text-pos")}
                      style={{ transform: "rotate(-14deg)" }}
                    >
                      PAID
                    </span>
                  </span>
                </>
              )}
              {open === "out" && (
                <>
                  <span className={cx(s.bob, "relative box-border h-[150px] w-[92px] rounded-[22px] bg-ink px-2 py-2.5")}>
                    <span className="relative box-border flex h-full flex-col gap-1.5 overflow-hidden rounded-[14px] bg-white px-2 py-2.5">
                      <span className="text-center text-[9px] font-bold">{sc.vendor}</span>
                      <span className="h-1 rounded-sm bg-surface" />
                      <span className="h-1 w-[70%] rounded-sm bg-surface" />
                      <span className="h-1 rounded-sm bg-surface" />
                      <span className="mt-auto text-right font-display text-[13px] font-bold">{sc.vamt}</span>
                      <span className={cx(s.scan, "absolute inset-x-0 top-[10%] h-[3px] bg-coming shadow-[0_0_12px_3px_rgba(122,90,248,0.55)]")} />
                    </span>
                  </span>
                  <span className="flex flex-col gap-2.5">
                    <span className={cx(s.pop, "inline-flex h-[34px] items-center gap-2 rounded-full border border-line bg-white px-3.5 text-[13px] font-semibold")}>
                      <span className="size-2 rounded-full bg-going" />
                      Read: {sc.vendor} · {sc.vamt}
                    </span>
                    <span className={cx(s.pop2, "inline-flex h-[34px] items-center gap-2 rounded-full bg-going-tint px-3.5 text-[13px] font-semibold")}>Filed under {sc.category}</span>
                    <span className={cx(s.pop2, "inline-flex h-[34px] items-center gap-2 rounded-full bg-pos-bg px-3.5 text-[13px] font-semibold text-pos")} style={{ animationDelay: "0.4s" }}>
                      Matched to your card charge
                    </span>
                  </span>
                </>
              )}
              {open === "keep" && (
                <>
                  <CashJar size={320} amount={dollars(n.keep)} />
                  <span className="flex max-w-[280px] flex-col gap-2.5">
                    <span className="font-hand text-[26px] font-bold leading-[1.1]">Every payment, split as it lands.</span>
                    <span className="text-sm leading-normal text-ink2">Three coins in the jar are yours. One goes in the envelope for tax, so tax time is never a surprise.</span>
                  </span>
                </>
              )}
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-3">
              {panel.items.map((it) => (
                <div key={it.title} className="flex flex-col gap-2.5 rounded-[18px] bg-bg p-[18px]">
                  <span className={cx("flex size-10 items-center justify-center rounded-xl", panel.tint)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d={it.icon} />
                    </svg>
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-base font-bold">{it.title}</span>
                    <span className="text-xs text-muted">{it.tag}</span>
                  </span>
                  <span className="text-sm leading-normal text-ink2">{it.ex}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-muted">Tap any number to see what BillingEase does behind it.</p>
        )}
      </div>
    </div>
  );
}
