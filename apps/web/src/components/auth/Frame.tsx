import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, ICONS, Logo, cx } from "@/components/ui";
import { Backdrop } from "./AuthArt";
import type { Cty } from "./country";

/**
 * The signed-out page frame from the prototype (AuthSignUp / AuthSignIn / AuthRecover):
 * logo and a sign-in/up link on top, paper drifting in the margins (a small band on
 * phones), the white form card next to the dark explainer card, and two links below.
 */
export function AuthFrame({
  country,
  variant,
  topLink,
  card,
  aside,
}: {
  country: Cty;
  variant: "signup" | "signin" | "forgot" | "reset";
  topLink: ReactNode;
  card: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div className="relative z-0 flex min-h-screen flex-col overflow-x-clip bg-bg">
      <div className="flex flex-1 flex-col gap-6 px-[clamp(16px,4vw,32px)] pb-10 pt-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" aria-label="BillingEase home" className="no-underline">
            <Logo />
          </Link>
          <span className="text-sm text-ink2">{topLink}</span>
        </header>

        <Backdrop country={country} variant={variant} />

        <main className="flex flex-1 flex-wrap items-stretch justify-center gap-4">
          <div className="box-border flex min-w-0 max-w-[480px] flex-[1_1_360px] flex-col gap-5 rounded-3xl border border-line bg-white p-[clamp(22px,5vw,40px)]">
            {card}
          </div>
          {aside}
        </main>

        <footer className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px]">
          <Link href="/" className="inline-flex min-h-6 items-center text-ink2 underline underline-offset-2">What is BillingEase?</Link>
          <Link href="/features" className="inline-flex min-h-6 items-center text-ink2 underline underline-offset-2">Everything it does</Link>
        </footer>
      </div>
    </div>
  );
}

/** The dark card beside the form. */
export function DarkPanel({ label, eyebrow, title, children }: { label: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <aside aria-label={label} className="box-border flex min-w-0 max-w-[400px] flex-[1_1_300px] flex-col gap-[18px] rounded-3xl bg-ink p-[clamp(22px,4vw,32px)] text-white">
      <span className="flex items-center gap-2 text-sm font-bold text-tint">
        <span className="size-2.5 rounded-full bg-violet" />
        {eyebrow}
      </span>
      <h2 className="font-display text-[26px] font-bold leading-[1.15] tracking-[-0.02em]">{title}</h2>
      {children}
    </aside>
  );
}

export function PanelBody({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-[1.55] text-tint">{children}</p>;
}

export function PanelFoot({ children }: { children: ReactNode }) {
  return <span className="mt-auto text-[13px] text-tint">{children}</span>;
}

/** Ticked list on the dark card. */
export function TickList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2.5 text-sm leading-[1.45]">
          <span className="mt-px flex size-5 flex-none items-center justify-center rounded-full bg-violet text-ink">
            <Icon d={ICONS.check} size={11} strokeWidth={3} />
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Coming in − Going out = Yours to keep, as the dark card shows it. */
export function EquationRows({ inAmt, outAmt, keepAmt, lines }: { inAmt: string; outAmt: string; keepAmt: string; lines?: { in: string; out: string; keep: string } }) {
  const row = "flex flex-col gap-1 rounded-[14px] bg-tint/[0.08] px-3.5 py-3";
  const top = "flex items-baseline justify-between gap-2.5 text-sm";
  const sub = "text-[13px] leading-[1.45] text-tint";
  return (
    <div className="flex flex-col gap-2">
      <div className={row}>
        <span className={top}><span className="flex items-center gap-2 font-semibold"><span className="size-2 rounded-full bg-coming-light" />Coming in</span><strong className="tabular">{inAmt}</strong></span>
        {lines && <span className={sub}>{lines.in}</span>}
      </div>
      <div className={row}>
        <span className={top}><span className="flex items-center gap-2 font-semibold"><span className="size-2 rounded-full bg-going-light" />− Going out</span><strong className="tabular">{outAmt}</strong></span>
        {lines && <span className={sub}>{lines.out}</span>}
      </div>
      <div className={cx(row, "bg-violet/[0.16]")}>
        <span className={top}><span className="font-semibold">= Yours to keep</span><strong className="tabular font-display text-2xl font-bold tracking-[-0.02em] text-violet">{keepAmt}</strong></span>
        {lines && <span className={sub}>{lines.keep}</span>}
      </div>
    </div>
  );
}

export function AuthTitle({ title, lead }: { title: string; lead?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-[clamp(30px,6vw,40px)] font-bold leading-[1.08] tracking-[-0.03em]">{title}</h1>
      {lead && <p className="text-[15px] leading-normal text-ink2">{lead}</p>}
    </div>
  );
}

/** A round badge above a state's title (sent, done). */
export function StateBadge({ tone, d }: { tone: "pos" | "violet"; d: string }) {
  return (
    <span className={cx("flex size-14 items-center justify-center rounded-full", tone === "pos" ? "bg-pos-bg text-pos" : "bg-tint text-ink")}>
      <Icon d={d} size={26} strokeWidth={tone === "pos" ? 2.6 : 2} />
    </span>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-[14px] bg-late-bg px-3.5 py-3 text-sm leading-[1.45] text-late">
      <Icon d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v5M12 16.5v.01" size={18} strokeWidth={2.2} className="mt-px flex-none" />
      <span className="font-semibold">{message}</span>
    </div>
  );
}

export function FormNote({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="status" className="rounded-2xl bg-tint px-4 py-3.5 text-sm leading-normal">{message}</p>;
}
