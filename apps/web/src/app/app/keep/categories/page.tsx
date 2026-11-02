import { books } from "@billingease/contracts";
import { rulesFor, today } from "@billingease/core";
import type { Metadata } from "next";
import { AppCrumbs } from "@/components/app/AppCrumbs";
import { Hero, Lines, Panel, pence, range } from "@/components/keep/parts";
import { load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";

export const metadata: Metadata = { title: "Categories" };

/** Categories (prototype BooksCategories): plain names with the official names underneath, and this year's totals. */
export default async function CategoriesPage() {
  const { business: b } = await requireBusiness();
  const rules = rulesFor(b.country);
  const lk = b.country === "lk";
  const us = b.country === "us";
  const cur = b.currency;
  const authority = lk ? "the IRD's" : us ? "the IRS's" : "HMRC's";
  const [cats, pl, bs] = await Promise.all([load(books.categories), load(books.profitAndLoss), load(books.balanceSheet, { query: { at: today() } })]);
  const yearLabel = `${rules.taxYearOf(today()).label} so far`;
  const entries = (n: number) => (n ? `${n} ${n === 1 ? "entry" : "entries"}` : undefined);
  const row = (c: (typeof cats.categories)[number]) => ({
    key: c.code, name: c.name, sub: c.official, count: entries(c.count), amount: c.amount ? pence(c.amount, cur) : "–",
    tag: !c.allowable ? { text: c.categoryId === "capital" ? "Capital allowances" : "Not allowable", tone: "neutral" as const } : undefined,
  });
  const business = cats.categories.filter((c) => c.scope === "business");
  const property = cats.categories.filter((c) => c.scope === "property");

  return (
    <>
      <AppCrumbs area="keep" trail={[{ label: "Yours to keep", href: "/app/keep" }, { label: "Categories" }]} />
      <Hero eyebrow={`Categories · ${lk ? "income tax return" : us ? "Schedule C" : "HMRC"} categories`} big={`${business.length + property.length} expense categories`}>
        Plain names on screen, {authority} names underneath. They match the boxes on {lk ? "your income tax return" : us ? "Schedule C" : "your quarterly updates"}, so your {rules.wording.practitionerNoun} files them as they are.
      </Hero>

      <Panel id="in-h" title="Money in" aside={<span className="text-[13px] text-muted">{range(cats.from, cats.to)}</span>}>
        <Lines heading={`Your name · ${authority} name`} rows={pl.income.map((l) => ({ key: l.code, name: l.name, sub: l.official ?? undefined, amount: pence(l.amount, cur) }))} empty="No income recorded this year yet." />
      </Panel>

      <Panel id="biz-h" title={`Expenses · ${lk ? "business income" : us ? "Schedule C" : "HMRC self-employment"} categories`} aside={<span className="text-[13px] text-muted">{yearLabel}</span>}>
        <Lines heading={`Your name · ${authority} name`}
          rows={[
            ...(cats.toSort.count ? [{ key: "sort", name: "Not sorted yet", sub: "Needs a category", tag: { text: "To sort", tone: "late" as const }, count: entries(cats.toSort.count), amount: pence(cats.toSort.amount, cur), tone: "late" as const, href: "/app/out?sort=1" }] : []),
            ...business.map(row),
          ]}
        />
      </Panel>

      {property.length > 0 && (
        <Panel id="prop-h" title="UK property" aside={<span className="text-[13px] text-muted">Property income and costs (SA105)</span>}>
          <Lines heading={`Your name · ${authority} name`} rows={property.map(row)} />
        </Panel>
      )}

      <Panel id="own-h" title="What you own and owe" aside={<span className="text-[13px] text-muted">Balance sheet accounts · today</span>}>
        <Lines rows={[...bs.assets, ...bs.liabilities, ...bs.equity].map((l) => ({ key: l.code, name: l.name, amount: pence(l.amount, cur) }))} empty="Nothing yet." />
      </Panel>
      <p className="text-[13px] text-muted">Categories come from {authority} boxes; they can&apos;t be renamed or removed, so every figure lands in the right place.</p>
    </>
  );
}
