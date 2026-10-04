import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** Small shared UI pieces in the BillingEase design language. */

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "outline" | "dark" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-violet text-ink hover:bg-[#a98ffb]",
  secondary: "bg-ink/[0.07] text-ink hover:bg-ink/[0.11]",
  outline: "border border-ink text-ink hover:bg-ink/[0.04]",
  dark: "bg-ink text-white hover:bg-black",
  ghost: "text-ink underline underline-offset-4 hover:text-black",
};

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cx(base, VARIANTS[variant], variant === "ghost" && "px-0 min-h-9", className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cx(base, VARIANTS[variant], variant === "ghost" && "px-0 min-h-9", className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-3xl border border-line bg-white", className)} {...props} />;
}

export type Tone = "pos" | "late" | "due" | "info" | "neutral" | "violet";

const TONES: Record<Tone, string> = {
  pos: "bg-pos-bg text-pos",
  late: "bg-late-bg text-late",
  due: "bg-due-bg text-due",
  info: "bg-info-bg text-info",
  neutral: "bg-surface text-ink2",
  violet: "bg-tint text-ink",
};

/** Status pill with a dot, so meaning never depends on color alone. */
export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", TONES[tone], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx("flex flex-col gap-1.5", className)}>
      <span className="text-[13px] font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-muted">{hint}</span>}
      {error && <span className="text-xs font-semibold text-late">{error}</span>}
    </label>
  );
}

export const inputClass =
  "min-h-11 w-full rounded-[10px] border border-input bg-white px-3.5 text-[15px] text-ink placeholder:text-muted/80 focus:border-ink focus:outline-none";

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={cx(inputClass, props.className)} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={cx(inputClass, "pr-8", props.className)} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea {...props} className={cx(inputClass, "min-h-24 py-2.5", props.className)} />;
}

export function SectionTitle({ children, aside, id }: { children: ReactNode; aside?: ReactNode; id?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <h2 id={id} className="font-display text-[22px] font-bold tracking-[-0.02em]">
        {children}
      </h2>
      {aside && <span className="text-[13px] text-muted">{aside}</span>}
    </div>
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex items-center justify-center rounded-[10px] bg-violet" style={{ width: size, height: size }}>
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" aria-hidden>
          <path d="M5 19 11 5h8l-6 14z" fill="#18161F" />
        </svg>
      </span>
      <span className="font-display text-[19px] font-bold tracking-[-0.02em]">BillingEase</span>
    </span>
  );
}

/** Stroke icons used across the app (24×24 paths). */
export const ICONS = {
  plus: "M12 5v14M5 12h14",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  arrowLeft: "M19 12H5M11 6l-6 6 6 6",
  check: "m5 12 5 5 9-10",
  clock: "M12 8v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  sort: "M4 6h16M4 12h10M4 18h6",
  people: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-1a4 4 0 0 0-3-3.8",
  doc: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M8 13h8M8 17h5",
  bill: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7",
  card: "M3 6h18v12H3zM3 10h18M7 15h3",
  bank: "M3 10 12 4l9 6M5 10v8M19 10v8M9.5 10v8M14.5 10v8M3 20h18",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  chevronDown: "m6 9 6 6 6-6",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
};

export function Icon({ d, size = 20, className, strokeWidth = 2 }: { d: string; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d={d} />
    </svg>
  );
}
