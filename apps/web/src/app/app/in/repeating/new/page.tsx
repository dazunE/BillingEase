import { comingIn } from "@billingease/contracts";
import { today } from "@billingease/core";
import type { Metadata } from "next";
import { Crumbs } from "@/components/in/bits";
import { editorBusiness, editorCustomers } from "@/components/in/data";
import { DocEditor } from "@/components/in/DocEditor";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { saveRecurring } from "../../actions";

export const metadata: Metadata = { title: "New repeating invoice" };

export default async function NewRepeatingPage({ searchParams }: { searchParams: Promise<{ customer?: string }> }) {
  const sp = await searchParams;
  const { business: b } = await requireBusiness();
  const [customers, items] = await Promise.all([load(comingIn.listCustomers), load(comingIn.listItems)]);
  const now = today();
  return (
    <>
      <Crumbs trail={[{ label: "Coming in", href: "/app/in" }, { label: "Repeating", href: "/app/in/repeating" }, { label: "New" }]} />
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[clamp(30px,4vw,40px)] font-bold leading-[1.05] tracking-[-0.03em]">New repeating invoice</h1>
        <p className="max-w-[640px] text-ink2">The same invoice on a schedule. Each run makes a draft for you to check and send, unless you choose to send it on the day.</p>
      </div>
      <DocEditor mode="repeating" business={editorBusiness(b)} customers={editorCustomers(customers.customers)} items={items.items} number="" today={now}
        initial={{ customerId: customers.customers.some((c) => c.id === sp.customer) ? sp.customer : undefined, issueDate: now, nextRun: now, termsDays: b.termsDays, lines: [], recurMode: "draft" }}
        action={saveRecurring} cancelHref="/app/in/repeating" />
    </>
  );
}
