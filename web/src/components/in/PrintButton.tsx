"use client";

import { ICONS, Icon } from "@/components/ui";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-violet px-5 text-[15px] font-semibold text-ink hover:bg-[#a98ffb] print:hidden"
    >
      <Icon d={ICONS.doc} size={18} />
      Print / Save as PDF
    </button>
  );
}
