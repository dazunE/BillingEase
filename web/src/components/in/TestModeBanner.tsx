/** Shown on every customer-facing page while payments run in the sandbox. */
export function TestModeBanner() {
  return (
    <p className="flex items-center justify-center gap-2 bg-due-bg px-4 py-2 text-center text-[13px] font-semibold text-due print:hidden">
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      Test mode: no real money moves
    </p>
  );
}
