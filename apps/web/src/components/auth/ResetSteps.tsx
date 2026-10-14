import { cx } from "@/components/ui";

const STEPS = ["Email", "Inbox", "New password", "Done"];

/** Where you are in resetting a password (prototype AuthRecover's stepper). */
export function ResetSteps({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <ol aria-label="Reset steps" className="flex gap-1.5">
      {STEPS.map((label, i) => {
        const n = i + 1;
        return (
          <li key={label} aria-current={n === step ? "step" : undefined} className={cx("flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-semibold", n <= step ? "text-ink" : "text-muted")}>
            <span className={cx("h-1.5 w-full rounded-full", n === step ? "bg-coming" : n < step ? "bg-ink" : "bg-line")} />
            <span className="truncate">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
