"use client";

import { rulesFor } from "@billingease/core";
import { useActionState, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Icon, ICONS, Logo, cx } from "@/components/ui";
import { Backdrop, StepArt, type StepPic } from "@/components/auth/AuthArt";
import { CountryCards, FieldError } from "@/components/auth/fields";
import { money, quarterSpans, ratesNote, ssclRate, vatRate, yearSpan, type Cty } from "@/components/auth/country";
import { SetupPreview, featuresFor, type Answers } from "./SetupPreview";
import { createBusiness } from "./actions";

/**
 * Setup, one question at a time (prototype SetupProfile): the business and its country,
 * what you do, tax registration, quarters (UK), then a check before "Set up my books".
 * Every step stays in the form (hidden), so the one action gets every field at the end.
 */

const KIND_DEFAULT: Record<Cty, string> = { uk: "sole_trader", lk: "sole_proprietor" };
const STEPS: Record<Cty, string[]> = {
  uk: ["Your business", "What you do", "VAT", "Quarters", "Check"],
  lk: ["Your business", "Business type", "Tax registration", "Check"],
};
/** Which step asks for each field, to go back to it when the API refuses one. */
const FIELD_STEP: Record<string, number> = { country: 1, name: 1, ownerName: 1, town: 1, kind: 2, taxId: 3, vatRegistered: 3, vatNumber: 3, ssclRegistered: 3, quarterType: 4, basis: 4 };

const COUNTRIES = {
  uk: { name: "United Kingdom", line: "Pounds · MTD quarters · HMRC categories" },
  lk: { name: "Sri Lanka", line: "Rupees · Tax Invoices · EPF, ETF and APIT" },
};

const I = {
  person: "M18 20v-1a5 5 0 0 0-5-5h-2a5 5 0 0 0-5 5v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  house: "M4 11 12 4l8 7M6 9.5V20h12V9.5M10 20v-5h4v5",
  both: "M3 20V11l6-5 6 5v9M7 20v-4h4v4M17 8h4M19 6v4",
  team: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.8M15 4.2a3.5 3.5 0 0 1 0 6.6",
  doc: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5",
  nodoc: "M6 3h9l4 4v14H6zM14 3v5h5M9 14l6 0",
  cal: "M4 6h16v15H4zM4 10h16M9 3v5M15 3v5",
  cash: "M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 10v4M18 10v4",
  spark: "M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2",
};

export function SetupForm({ initialCountry, ownerName, email }: { initialCountry: Cty | null; ownerName: string; email: string }) {
  const [state, action, pending] = useActionState(createBusiness, undefined);
  const [a, setA] = useState<Answers>(() => {
    const country = initialCountry ?? "uk";
    return { country, name: "", ownerName, town: "", kind: KIND_DEFAULT[country], vat: false, vatNumber: "", taxId: "", sscl: false, quarterType: "standard", basis: rulesFor(country).defaultBasis };
  });
  const [picked, setPicked] = useState(initialCountry !== null);
  const [step, setStep] = useState(1);
  const [reached, setReached] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [note, setNote] = useState<{ text: string; prev: string[] } | null>(null);

  // A refusal from the API: show its field errors and go back to the first step that has one.
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    const fieldErrors = state?.errors ?? {};
    setErrors(fieldErrors);
    const first = Math.min(...Object.keys(fieldErrors).map((k) => FIELD_STEP[k] ?? 99));
    if (first < 99) setStep(first);
  }

  const lk = a.country === "lk";
  const r = rulesFor(a.country);
  const names = STEPS[a.country];
  const N = names.length;
  const last = step === N;

  const go = (n: number) => {
    setStep(n);
    setReached((x) => Math.max(x, n));
    setNote(null);
    setErrors({});
  };

  /** Records an answer and says what it added to or tucked away from the home. */
  const answer = (patch: Partial<Answers>) => {
    const before = featuresFor(a).filter((f) => f.on);
    const next = { ...a, ...patch };
    const after = featuresFor(next).filter((f) => f.on);
    const bk = before.map((f) => f.k), ak = after.map((f) => f.k);
    const added = after.filter((f) => !bk.includes(f.k)).map((f) => f.t);
    const removed = before.filter((f) => !ak.includes(f.k)).map((f) => f.t);
    const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
    let text = added.length ? `Added to your home: ${list(added)}.` : "";
    if (removed.length) text += `${text ? " " : ""}Tucked away: ${list(removed)}.`;
    setA(next);
    setNote(text ? { text, prev: bk } : null);
    setErrors({});
  };

  const pickCountry = (c: Cty) => {
    setPicked(true);
    if (c === a.country) return;
    setA({ ...a, country: c, kind: KIND_DEFAULT[c], vat: false, vatNumber: "", taxId: "", sscl: false, quarterType: "standard", basis: rulesFor(c).defaultBasis });
    setReached(1);
    setNote(null);
  };

  const check = (): Record<string, string> => {
    if (step === 1) {
      const e: Record<string, string> = {};
      if (!picked) e.country = "Choose where your business is. It decides your tax rules.";
      if (!a.name.trim()) e.name = "Add your business name. It goes on your invoices.";
      if (!a.ownerName.trim()) e.ownerName = "Add your name.";
      return e;
    }
    if (step === 3 && a.vat && !a.vatNumber.trim()) return { vatNumber: `Add your ${r.wording.vatIdLabel}. It goes on every ${r.wording.vatInvoiceTitle}.` };
    return {};
  };

  const next = () => {
    const e = check();
    if (Object.keys(e).length) return setErrors(e);
    go(step + 1);
  };

  /** The progress bar: back freely, forward only past a step that checks out. */
  const jump = (n: number) => {
    const e = n > step ? check() : {};
    if (Object.keys(e).length) return setErrors(e);
    go(n);
  };

  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    // Enter in a field moves to the next step; only the last step sends the form.
    if (!last) {
      ev.preventDefault();
      next();
    }
  };

  const fmt0 = money(0, a.country);
  const quarters = { standard: quarterSpans("standard"), calendar: quarterSpans("calendar") };
  const KIND_NAME: Record<string, string> = { sole_trader: "Sole trader", landlord: "Landlord", both: "Sole trader and landlord", sole_proprietor: "Sole proprietor", partnership: "Partnership" };

  // The picture beside each question.
  const pic: StepPic = step === 1 ? "biz" : step === 2 ? "kind" : step === 3 ? "tax" : !lk && step === 4 ? "cal" : "done";

  const head = (title: string, help: ReactNode) => (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
        <h1 className="font-display text-[clamp(28px,3.6vw,40px)] font-bold leading-[1.1] tracking-[-0.03em]">{title}</h1>
        <p className="text-base leading-normal text-ink2">{help}</p>
      </div>
      <StepArt pic={pic} country={a.country} kind={a.kind} stamp={lk ? "TIN" : "VAT"} />
    </div>
  );

  const summary: { k: string; v: string; s: number }[] = [
    { k: "Business", v: `${a.name.trim() || "Your business"} · ${a.town.trim() ? `${a.town.trim()}, ` : ""}${r.name}`, s: 1 },
    { k: "You", v: `${a.ownerName.trim() || "You"}${email ? ` · ${email}` : ""}`, s: 1 },
    { k: lk ? "Business type" : "What you do", v: KIND_NAME[a.kind] ?? a.kind, s: 2 },
    ...(lk
      ? [{ k: "Tax", v: `${a.taxId.trim() ? `TIN ${a.taxId.trim()} · ` : ""}VAT ${a.vat ? "yes" : "no"}${a.vat && a.vatNumber.trim() ? ` (${a.vatNumber.trim()})` : ""} · SSCL ${a.sscl ? "yes" : "no"}`, s: 3 }]
      : [
          { k: "VAT", v: a.vat ? `VAT registered${a.vatNumber.trim() ? ` · ${a.vatNumber.trim()}` : ""}` : "Not VAT registered", s: 3 },
          { k: "Quarters", v: `${a.quarterType === "calendar" ? "Calendar" : "Standard"} quarters · ${a.basis === "accrual" ? "accruals basis" : "cash basis"}`, s: 4 },
        ]),
  ];
  const hidden = featuresFor(a).filter((f) => !f.on).length;

  return (
    <div className="relative z-0 min-h-screen overflow-x-clip bg-bg">
      <Backdrop country={a.country} setup />
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-5 gap-y-3 px-[clamp(16px,4vw,40px)] pt-5">
        <SetupLogo />
        <span className="hidden text-sm text-ink2 sm:inline">Signed in as <strong className="font-semibold text-ink">{email}</strong></span>
      </div>

      <main className="mx-auto flex max-w-[1200px] flex-wrap items-start gap-x-10 gap-y-7 px-[clamp(16px,4vw,40px)] pb-16 pt-7">
        <form action={action} onSubmit={onSubmit} noValidate aria-label="Set up your business" className="flex min-w-0 max-w-[680px] flex-[999_1_520px] flex-col gap-[26px]">
          {/* Progress */}
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-sm font-bold">Step {step} of {N} · {names[step - 1]}</span>
              <span className="text-[13px] text-muted">About a minute · you can change most of it later</span>
            </div>
            <ol aria-label="Setup steps" className="flex gap-1.5">
              {names.map((label, i) => {
                const n = i + 1, isCur = n === step, isDone = n < step;
                const aria = `Step ${n} of ${N}: ${label}${isDone ? ", done" : isCur ? ", current" : ""}`;
                const inner = (
                  <>
                    <span className={cx("block h-1.5 w-full rounded-full", isDone ? "bg-ink" : isCur ? "bg-coming" : "bg-line")} />
                    <span className="hidden truncate sm:block">{label}</span>
                  </>
                );
                return (
                  <li key={label} className="min-w-0 flex-[1_1_0]">
                    {n <= reached && !isCur ? (
                      <button type="button" onClick={() => jump(n)} aria-label={aria}
                        className="flex w-full flex-col gap-1.5 py-1.5 text-left text-xs font-semibold text-ink2">{inner}</button>
                    ) : (
                      <span aria-current={isCur ? "step" : undefined} aria-label={aria} className={cx("flex w-full flex-col gap-1.5 py-1.5 text-xs font-semibold", isCur ? "text-ink" : "text-muted")}>{inner}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          {/* 1 · The business and its country */}
          <div hidden={step !== 1} className="flex flex-col gap-[22px]">
            {head("What's your business called, and where is it?", "Your country sets the currency, the tax year, the expense categories and the tax rules. It stays fixed once your business is set up.")}
            <CountryCards big legend="Country" value={picked ? a.country : ""} onChange={pickCountry} names={COUNTRIES} error={errors.country}
              hint={initialCountry ? "From your sign-up. Change it here if that was a slip; it can’t change once you start." : undefined} />
            <SetupField id="sp-name" label="Business name" name="name" big value={a.name} onChange={(x) => setA({ ...a, name: x })} error={errors.name}
              placeholder={lk ? "e.g. Serendib Design Studio" : "e.g. Harper Studio"} autoComplete="organization"
              hint="It goes at the top of your invoices and quotes. Your own name is fine if you trade as yourself." />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4">
              <SetupField id="sp-owner" label="Your name" name="ownerName" value={a.ownerName} onChange={(x) => setA({ ...a, ownerName: x })} error={errors.ownerName} autoComplete="name"
                hint="Shown as the owner on your business profile." />
              <SetupField id="sp-town" label="Town or city" optional name="town" value={a.town} onChange={(x) => setA({ ...a, town: x })} error={errors.town}
                placeholder={lk ? "e.g. Colombo 03" : "e.g. Leeds"} autoComplete="address-level2" hint="Shown under your business name on invoices." />
            </div>
            <div className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-white px-5 py-[18px]">
              <span className="text-[13px] font-bold text-ink2">Set for you from {r.name}</span>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,150px),1fr))] gap-3">
                <Fact k="Currency" v={`${r.currency} · ${money(1250, a.country)}`} />
                <Fact k={lk ? "Year of assessment" : "Tax year"} v={yearSpan(a.country)} />
                <Fact k="Tax on sales" v={lk ? "VAT and SSCL" : "VAT"} />
              </div>
              <span className="text-sm leading-normal text-ink2">
                {lk
                  ? `Registered businesses issue ${r.wording.vatInvoiceTitle}s with VAT at ${vatRate("lk")} and SSCL as its own line. Employees are paid with EPF, ETF and APIT worked out for you. ${ratesNote("lk")}`
                  : "Expenses go into HMRC’s categories and add up by quarter for Making Tax Digital. VAT applies only if you’re registered."}
              </span>
            </div>
          </div>

          {/* 2 · What you do / business type */}
          <div hidden={step !== 2} className="flex flex-col gap-[22px]">
            {lk
              ? head("What kind of business is it?", `This sets how your profit is taxed and what your ${r.wording.practitionerNoun} hands over to ${r.wording.practitionerTool} at year end.`)
              : head("What do you do?", "This decides which HMRC pages your records fill: self-employment, UK property, or both.")}
            <div role="radiogroup" aria-label={lk ? "Business type" : "What you do"} className="flex flex-col gap-2.5">
              {(lk
                ? [
                    { id: "sole_proprietor", title: "Sole proprietor", ex: "You own it yourself, even with staff. The profit goes on your own income tax return.", official: "Individual: business income", icon: I.person, tint: "bg-tint" },
                    { id: "partnership", title: "Partnership", ex: "Two or more partners sharing the profit.", official: "Partnership", icon: I.team, tint: "bg-going-tint" },
                  ]
                : [
                    { id: "sole_trader", title: "Sole trader", ex: "You work for yourself, like design, trades, tutoring or consulting.", official: "Self-employment income", icon: I.person, tint: "bg-tint" },
                    { id: "landlord", title: "Landlord", ex: "You let a home, a flat or a room, and don’t trade otherwise.", official: "UK property income", icon: I.house, tint: "bg-going-tint" },
                    { id: "both", title: "Both", ex: "You work for yourself and also let property, like a designer who lets a flat.", official: "Self-employment and UK property income", icon: I.both, tint: "bg-surface" },
                  ]
              ).map((o) => (
                <ChoiceCard key={o.id} name="kind" value={o.id} on={a.kind === o.id} onPick={() => answer({ kind: o.id })} {...o} />
              ))}
            </div>
            {errors.kind && <FieldError>{errors.kind}</FieldError>}
          </div>

          {/* 3 · Tax registration */}
          <div hidden={step !== 3} className="flex flex-col gap-[22px]">
            {lk ? (
              <>
                {head("Your tax registrations", "These decide what your invoices show and which VAT and SSCL periods appear under Yours to keep.")}
                <BoxField id="sp-tin" label={`${r.wording.taxIdLabel} (optional)`} name="taxId" value={a.taxId} onChange={(x) => setA({ ...a, taxId: x })} error={errors.taxId} placeholder="123 456 789" inputMode="numeric"
                  hint="Your Taxpayer Identification Number from the Inland Revenue Department. It goes on your invoices; add it later if it isn’t to hand." />
                <Seg name="vatRegistered" label="Registered for VAT?" sub={`VAT is ${vatRate("lk")}. Registered businesses issue ${r.wording.vatInvoiceTitle}s in the IRD format.`} value={a.vat} onPick={(x) => answer({ vat: x })} />
                {a.vat && (
                  <BoxField id="sp-vatno" label={r.wording.vatIdLabel} name="vatNumber" value={a.vatNumber} onChange={(x) => setA({ ...a, vatNumber: x })} error={errors.vatNumber} placeholder="123456789-7000"
                    hint={`Printed on every ${r.wording.vatInvoiceTitle}.`} />
                )}
                <Seg name="ssclRegistered" label="Registered for SSCL?" sub={`Social Security Contribution Levy, ${ssclRate("lk")} shown as its own line on invoices.`} value={a.sscl} onPick={(x) => answer({ sscl: x })} />
              </>
            ) : (
              <>
                {head("Are you registered for VAT?", `You must register once your taxable turnover passes ${money(r.vatThreshold / 100, "uk")} in 12 months. Some people register earlier.`)}
                <div role="radiogroup" aria-label="VAT registration" className="flex flex-col gap-2.5">
                  <ChoiceCard name="vatRegistered" value="off" on={!a.vat} onPick={() => answer({ vat: false })} icon={I.nodoc} tint="bg-tint"
                    title="No, not VAT registered" ex={`Most sole traders and landlords under ${money(r.vatThreshold / 100, "uk")} a year aren’t. Invoices go out without VAT.`} />
                  <ChoiceCard name="vatRegistered" value="on" on={a.vat} onPick={() => answer({ vat: true })} icon={I.doc} tint="bg-going-tint"
                    title="Yes, VAT registered" ex={`Invoices become ${r.wording.vatInvoiceTitle}s, and you get a VAT summary each quarter. Your accountant files VAT from their own software.`} />
                </div>
                {a.vat && (
                  <BoxField id="sp-vatno" label={r.wording.vatIdLabel} name="vatNumber" value={a.vatNumber} onChange={(x) => setA({ ...a, vatNumber: x })} error={errors.vatNumber} placeholder="GB 123 4567 89"
                    hint={`It goes on every ${r.wording.vatInvoiceTitle}.`} />
                )}
                <BoxField id="sp-utr" label="Unique Taxpayer Reference (UTR) (optional)" name="taxId" value={a.taxId} onChange={(x) => setA({ ...a, taxId: x })} error={errors.taxId} inputMode="numeric"
                  hint="10 digits, on letters from HMRC. Your accountant may already have it; add it later if it isn’t to hand." />
              </>
            )}
          </div>

          {/* 4 · Quarters (UK) */}
          {!lk && (
            <div hidden={step !== 4} className="flex flex-col gap-[22px]">
              {head("How do your quarters run?", "Making Tax Digital asks for an update every quarter. Your accountant can tell you which you use; most people keep the standard dates.")}
              <div className="flex flex-col gap-2.5">
                <span id="q-dates" className="text-base font-bold">Quarter dates</span>
                <div role="radiogroup" aria-labelledby="q-dates" className="flex flex-col gap-2.5">
                  <ChoiceCard name="quarterType" value="standard" on={a.quarterType === "standard"} onPick={() => answer({ quarterType: "standard" })} icon={I.cal} tint="bg-tint" tag="Most people"
                    title="Standard quarters" ex={`${quarters.standard}. They line up with the tax year.`} official="Standard update periods" />
                  <ChoiceCard name="quarterType" value="calendar" on={a.quarterType === "calendar"} onPick={() => answer({ quarterType: "calendar" })} icon={I.cal} tint="bg-surface"
                    title="Calendar quarters" ex={`${quarters.calendar}. Handy if your other records run by month end.`} official="Calendar update periods (an election you make)" />
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <span id="q-basis" className="text-base font-bold">When money counts</span>
                <div role="radiogroup" aria-labelledby="q-basis" className="flex flex-col gap-2.5">
                  <ChoiceCard name="basis" value="cash" on={a.basis === "cash"} onPick={() => answer({ basis: "cash" })} icon={I.cash} tint="bg-tint" tag="Default"
                    title="When it’s paid" ex="Income counts when a customer pays you, costs when you pay them. Simplest for most sole traders." official="Cash basis" />
                  <ChoiceCard name="basis" value="accrual" on={a.basis === "accrual"} onPick={() => answer({ basis: "accrual" })} icon={I.doc} tint="bg-surface"
                    title="When it’s invoiced" ex="Income counts on the invoice date and costs on the bill date, paid or not. Pick this if your accountant asks for it." official="Accruals basis (traditional accounting)" />
                </div>
              </div>
            </div>
          )}
          {lk && <input type="hidden" name="basis" value="accrual" />}

          {/* What that answer changed */}
          {note && step > 1 && !last && (
            <div aria-live="polite" className="flex items-start gap-2.5 rounded-2xl bg-tint px-4 py-3 text-sm leading-normal">
              <Icon d={I.spark} size={18} className="mt-0.5 flex-none" />
              <span>{note.text}</span>
            </div>
          )}

          {/* Last · check, then set up */}
          <div hidden={!last} className="flex flex-col gap-[22px]">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
                <span className="inline-flex items-center gap-2 self-start rounded-full bg-pos-bg px-3 py-1 text-[13px] font-semibold text-pos"><span className="size-1.5 rounded-full bg-pos" />Ready to set up</span>
                <h1 className="font-display text-[clamp(30px,4vw,44px)] font-bold leading-[1.1] tracking-[-0.03em]">Here&apos;s your BillingEase</h1>
                <p className="text-base leading-normal text-ink2">
                  Three numbers on your home, with {lk ? "Sri Lankan" : "UK"} tax rules behind them and only the features that fit how {a.name.trim() || "your business"} works.
                  {hidden ? ` ${hidden} more features stay out of sight until you need them.` : ""}
                </p>
              </div>
              <StepArt pic="done" country={a.country} />
            </div>
            <dl className="flex flex-col rounded-[20px] border border-line bg-white px-5 py-1.5">
              {summary.map((row, i) => (
                <div key={row.k} className={cx("flex flex-wrap items-center gap-x-4 gap-y-1 py-3.5", i < summary.length - 1 && "border-b border-divider")}>
                  <dt className="flex-[0_0_150px] text-[13px] font-semibold text-muted">{row.k}</dt>
                  <dd className="min-w-0 flex-[1_1_200px] text-[15px] font-semibold leading-[1.45] [overflow-wrap:anywhere]">{row.v}</dd>
                  <button type="button" onClick={() => go(row.s)} aria-label={`Change ${row.k.toLowerCase()}`} className="min-h-9 rounded-full px-3 text-sm font-semibold underline underline-offset-[3px]">Change</button>
                </div>
              ))}
            </dl>
            <div className="flex items-start gap-3 rounded-[20px] border border-line bg-white px-[18px] py-4">
              <span className="flex size-9 flex-none items-center justify-center rounded-xl bg-surface">
                <Icon d="M4 7h10M18 7h2M4 17h4M12 17h8M16 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM10 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" size={18} />
              </span>
              <span className="text-sm leading-normal text-ink2">Change any answer except the country later in Business profile, and features appear or tuck away to match. Your books start at {fmt0} and fill in as you add invoices and costs.</span>
            </div>
          </div>

          {state?.message && <p role="alert" className="rounded-[14px] bg-late-bg px-3.5 py-3 text-sm font-semibold text-late">{state.message}</p>}

          {/* Step nav */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-3">
            {step > 1 && (
              <button type="button" onClick={() => go(step - 1)} className="inline-flex min-h-12 items-center gap-1.5 rounded-full bg-ink/[0.07] px-5 text-[15px] font-semibold hover:bg-ink/[0.11]">
                <Icon d={ICONS.arrowLeft} size={18} />
                Back
              </button>
            )}
            {last ? (
              <button key="submit" type="submit" disabled={pending} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-violet px-6 text-[15px] font-semibold hover:bg-[#a98ffb] disabled:opacity-50">
                {pending ? "Setting up…" : "Set up my books"}
                <Icon d={ICONS.arrowRight} size={18} />
              </button>
            ) : (
              <button key="continue" type="button" onClick={next} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-violet px-6 text-[15px] font-semibold hover:bg-[#a98ffb]">
                Continue
                <Icon d={ICONS.arrowRight} size={18} />
              </button>
            )}
          </div>
          {!last && (
            <p className="text-[13px] leading-normal text-muted">
              Not sure? Pick the closest answer. You can change it later in Business profile, or ask your {r.wording.practitionerNoun}.
            </p>
          )}

        </form>

        <SetupPreview answers={a} done={last} prev={note?.prev ?? null} />
      </main>
    </div>
  );
}

function SetupLogo() {
  return (
    <Link href="/" aria-label="BillingEase home" className="no-underline">
      <Logo />
    </Link>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted">{k}</span>
      <span className="text-base font-bold">{v}</span>
    </div>
  );
}

function SetupField({ id, label, optional, hint, error, big, onChange, ...input }: {
  id: string; label: string; optional?: boolean; hint?: string; error?: string; big?: boolean; onChange: (v: string) => void;
  name: string; value: string; placeholder?: string; autoComplete?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">{label}{optional && <span className="font-normal text-muted"> (optional)</span>}</label>
      <input id={id} {...input} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error || hint ? `${id}-note` : undefined}
        className={cx("w-full rounded-[10px] border bg-white px-4 text-ink placeholder:text-muted/80 focus:outline-2 focus:outline-offset-1 focus:outline-coming", big ? "min-h-14 text-lg font-medium" : "min-h-[52px] text-[17px] font-medium", error ? "border-late" : "border-input")} />
      {error && <span id={`${id}-note`} role="alert" className="text-[13px] font-semibold text-late">{error}</span>}
      {hint && !error && <span id={`${id}-note`} className="text-[13px] text-muted">{hint}</span>}
    </div>
  );
}

/** A field in its own white box, under a choice (VAT number, TIN, UTR). */
function BoxField({ id, label, hint, error, onChange, ...input }: {
  id: string; label: string; hint?: string; error?: string; onChange: (v: string) => void;
  name: string; value: string; placeholder?: string; inputMode?: "numeric";
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[18px] border border-line bg-white px-[18px] py-4">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <input id={id} {...input} autoComplete="off" onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error || hint ? `${id}-note` : undefined}
        className={cx("min-h-12 w-full rounded-[10px] border bg-white px-3.5 text-base font-medium text-ink placeholder:text-muted/80 focus:outline-2 focus:outline-offset-1 focus:outline-coming", error ? "border-late" : "border-input")} />
      {error && <span id={`${id}-note`} role="alert" className="text-[13px] font-semibold text-late">{error}</span>}
      {hint && !error && <span id={`${id}-note`} className="text-[13px] leading-[1.45] text-muted">{hint}</span>}
    </div>
  );
}

/** A big choice card. The radio covers the card, so the whole card is the target. */
function ChoiceCard({ name, value, on, onPick, title, ex, official, tag, icon, tint }: {
  name: string; value: string; on: boolean; onPick: () => void; title: string; ex: string; official?: string; tag?: string; icon: string; tint: string;
}) {
  return (
    <label className={cx(
      "relative flex min-h-20 w-full cursor-pointer items-center gap-4 rounded-[20px] border-2 px-[18px] py-3.5 transition-colors hover:border-ink has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-coming",
      on ? "border-ink bg-tint" : "border-line bg-white",
    )}>
      <input type="radio" name={name} value={value} checked={on} onChange={onPick} className="absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none opacity-0" />
      <span className={cx("flex size-12 flex-none items-center justify-center rounded-[14px]", tint)}>
        <Icon d={icon} size={24} strokeWidth={1.9} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[17px] font-bold">{title}</span>
          {tag && <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-ink2">{tag}</span>}
        </span>
        <span className="text-sm leading-[1.45] text-ink2">{ex}</span>
        {official && <span className="text-xs leading-[1.4] text-muted">{official}</span>}
      </span>
      <span aria-hidden className={cx("flex size-[26px] flex-none items-center justify-center rounded-full border-2", on ? "border-ink bg-ink text-violet" : "border-input bg-white text-white")}>
        <Icon d={ICONS.check} size={14} strokeWidth={3.2} />
      </span>
    </label>
  );
}

/** Yes / No as a segmented pill. */
function Seg({ name, label, sub, value, onPick }: { name: string; label: string; sub: string; value: boolean; onPick: (v: boolean) => void }) {
  const id = `seg-${name}`;
  return (
    <div className="flex flex-col gap-2.5">
      <span className="flex flex-col gap-0.5">
        <span id={id} className="text-base font-bold">{label}</span>
        <span className="text-[13px] leading-[1.45] text-muted">{sub}</span>
      </span>
      <div role="radiogroup" aria-labelledby={id} className="inline-flex max-w-full flex-wrap gap-1 self-start rounded-[22px] bg-surface p-1">
        {([[false, "No"], [true, "Yes"]] as const).map(([val, text]) => (
          <label key={text} className={cx("relative inline-flex min-h-11 cursor-pointer items-center rounded-full px-5 text-[15px] font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-coming", value === val ? "bg-ink text-white" : "text-ink")}>
            <input type="radio" name={name} value={val ? "on" : "off"} checked={value === val} onChange={() => onPick(val)} className="absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none opacity-0" />
            {text}
          </label>
        ))}
      </div>
    </div>
  );
}
