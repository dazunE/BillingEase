import Link from "next/link";
import type { Business } from "@billingease/contracts";
import { reopenBusiness } from "@/app/app/settings/security/actions";

/** On every page of a closed business: what's happening, when it's deleted, and the way back. */
export function ClosedBanner({ business: b }: { business: Business }) {
  if (!b.closedAt) return null;
  const day = new Date(b.purgeAfter ?? b.closedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-[20px] bg-late-bg px-[18px] py-3.5">
      <span className="flex min-w-[240px] flex-1 flex-col gap-0.5">
        <strong className="text-sm text-late">{b.name} is closed. Everything is deleted on {day}.</strong>
        <span className="text-[13px] text-ink2">Nothing can change until then. Take your records out first from <Link href="/app/settings/security#export-h" className="font-semibold">Security and data</Link>.</span>
      </span>
      {b.role === "owner" && (
        <form action={reopenBusiness}>
          <button className="inline-flex min-h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-white hover:bg-black">Reopen {b.name}</button>
        </form>
      )}
    </div>
  );
}
