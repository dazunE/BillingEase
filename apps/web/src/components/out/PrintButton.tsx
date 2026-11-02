"use client";

import { Button } from "@/components/ui";

export function PrintButton({ label = "Print or save as PDF" }: { label?: string }) {
  return <Button variant="secondary" type="button" onClick={() => window.print()}>{label}</Button>;
}
