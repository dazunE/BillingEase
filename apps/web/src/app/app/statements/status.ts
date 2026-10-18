import type { Statement } from "@billingease/contracts";

export const STATUS: Record<Statement["status"], { label: string; tone: "info" | "pos" | "late" | "neutral" }> = {
  queued: { label: "Waiting to be read", tone: "neutral" },
  reading: { label: "Reading", tone: "info" },
  matching: { label: "Matching", tone: "info" },
  done: { label: "Read", tone: "pos" },
  failed: { label: "Couldn't be read", tone: "late" },
};

export const busy = (s: Statement) => s.status === "queued" || s.status === "reading" || s.status === "matching";
