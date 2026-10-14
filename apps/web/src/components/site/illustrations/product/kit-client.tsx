import { cx } from "@/components/ui";

/* Small visual pieces safe to use from client components (no next/link or server-only imports). */

/** A visual-only switch track (inside a role="switch" button). */
export function SwitchTrack({ on, dark = false }: { on: boolean; dark?: boolean }) {
  return (
    <span aria-hidden className={cx("relative h-[26px] w-11 flex-none rounded-full transition-colors", on ? "bg-coming" : dark ? "bg-ink2" : "bg-input")}>
      <span className="absolute top-[3px] size-5 rounded-full bg-white transition-[left]" style={{ left: on ? 21 : 3 }} />
    </span>
  );
}

/** Check icon in a small circle. */
export function CheckDot({ tint = "bg-tint", stroke = "#18161F", size = 20 }: { tint?: string; stroke?: string; size?: number }) {
  return (
    <span aria-hidden className={cx("mt-px flex flex-none items-center justify-center rounded-full", tint)} style={{ width: size, height: size }}>
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 12 5 5 9-10" />
      </svg>
    </span>
  );
}
