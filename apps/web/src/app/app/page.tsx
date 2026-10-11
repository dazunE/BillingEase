import { rulesFor } from "@billingease/core";
import { requireBusiness } from "@/lib/session";

export default async function HomePage() {
  const { me, business } = await requireBusiness();
  const rules = rulesFor(business.country);
  return (
    <section className="flex flex-col gap-3">
      <h1 className="font-display text-[clamp(30px,4vw,44px)] font-bold tracking-[-0.03em]">Hello, {me.user.name.split(" ")[0]}</h1>
      <p className="text-ink2">{business.name} · {rules.name} · tax year {rules.taxYearOf(new Date().toISOString().slice(0, 10)).label}</p>
    </section>
  );
}
