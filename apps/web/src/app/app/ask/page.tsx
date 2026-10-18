import { ask, type AskMessage } from "@billingease/contracts";
import { rulesFor } from "@billingease/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ago } from "@/components/home/format";
import { cx } from "@/components/ui";
import { ApiFailure, load } from "@/lib/api";
import { requireBusiness } from "@/lib/session";
import { Answer } from "./Answer";
import { AskBox } from "./AskBox";
import { AppCrumbs } from "@/components/app/AppCrumbs";

export const metadata: Metadata = { title: "Ask" };

const SUGGESTIONS = {
  uk: [
    "What expenses can I claim as a sole trader?",
    "How much have I made this quarter?",
    "When is my next Making Tax Digital update due?",
    "Do I need to register for VAT?",
    "How much can I claim for business mileage?",
    "Which invoices are late?",
  ],
  lk: [
    "How do VAT and SSCL show on a Tax Invoice?",
    "How much VAT do I owe for September?",
    "When are my income tax instalments due?",
    "How are EPF and ETF worked out?",
    "Is my office rent an allowable expense?",
    "Which invoices are late?",
  ],
};

export default async function AskPage({ searchParams }: { searchParams: Promise<{ thread?: string }> }) {
  const { business } = await requireBusiness();
  const { thread: threadId } = await searchParams;
  const rules = rulesFor(business.country);
  const uk = business.country === "uk";
  const practitioner = rules.wording.practitionerNoun;
  const { threads, setUp } = await load(ask.threads);

  let messages: AskMessage[] = [];
  if (threadId) {
    try {
      messages = (await load(ask.thread, { params: { id: threadId } })).messages;
    } catch (err) {
      if (err instanceof ApiFailure && err.status === 404) notFound();
      throw err;
    }
  }
  const pairs: { q: string; a: AskMessage }[] = [];
  for (let i = 0; i < messages.length; i++) if (messages[i].role === "assistant") pairs.push({ q: messages[i - 1]?.content ?? "", a: messages[i] });

  return (
    <>
    <AppCrumbs trail={[{ label: "Ask" }]} />
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section aria-labelledby="ask-h" className="flex min-w-0 flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-muted">AI answers for {uk ? "the UK" : "Sri Lanka"}</span>
          <h1 id="ask-h" className="font-display text-[clamp(30px,4vw,40px)] font-bold leading-[1.05] tracking-[-0.03em]">Ask about tax and your books</h1>
          <p className="max-w-[680px] text-ink2">Answers come from your own books and {rules.askSources}, and list the sources they rely on. They can be wrong and they never file anything. When it needs judgement, ask your {practitioner}.</p>
        </div>

        {!setUp && (
          <div role="status" className="flex flex-col gap-1 rounded-2xl bg-due-bg px-5 py-4 text-due" data-testid="ask-not-set-up">
            <strong>Ask isn&apos;t set up yet</strong>
            <span className="text-sm">It needs Vertex AI on the BillingEase server. Your books are fine; ask whoever runs BillingEase for you to set it up. Until then, your {practitioner} is the person to ask.</span>
          </div>
        )}

        {pairs.length > 0 && (
          <div className="flex flex-col gap-4" aria-live="polite">
            {pairs.map((p, i) => <Answer key={p.a.id} question={p.q} answer={p.a} practitioner={practitioner} latest={i === pairs.length - 1} />)}
          </div>
        )}

        <AskBox key={threadId ?? "new"} threadId={threadId} disabled={!setUp} suggestions={SUGGESTIONS[business.country]}
          placeholder={uk ? "For example: can I claim my phone bill if I also use it personally?" : "For example: do I charge SSCL on a quote I've already sent?"} />

        {pairs.length === 0 && setUp && (
          <div className="flex flex-col gap-1 rounded-3xl border border-dashed border-input p-6 text-center">
            <span className="font-display text-lg font-bold">Your answers show up here</span>
            <span className="text-sm text-ink2">Ask in your own words, or tap a question above. Each answer lists the sources it used: your books, and official pages.</span>
          </div>
        )}
      </section>

      <aside className="flex flex-col gap-4">
        <section aria-labelledby="threads-h" className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 id="threads-h" className="font-display text-lg font-bold tracking-[-0.02em]">Your questions</h2>
            {threadId && <Link href="/app/ask" className="flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">New question</Link>}
          </div>
          {threads.length === 0 ? <p className="text-sm text-ink2">Questions you ask are kept here so you can come back to them.</p> : (
            <ul className="flex flex-col">
              {threads.map((t) => (
                <li key={t.id}>
                  <Link href={`/app/ask?thread=${t.id}`} aria-current={t.id === threadId ? "page" : undefined}
                    className={cx("flex min-h-11 flex-col justify-center rounded-xl px-3 py-2 hover:bg-surface", t.id === threadId && "bg-tint")}>
                    <span className="line-clamp-2 text-sm font-semibold">{t.title}</span>
                    <span className="text-xs text-muted">{ago(t.lastAt)} · {t.messages / 2} answer{t.messages === 2 ? "" : "s"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="how-h" className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-5">
          <h2 id="how-h" className="font-display text-lg font-bold tracking-[-0.02em]">How Ask works</h2>
          <ul className="flex flex-col gap-2 text-sm text-ink2">
            <li>It reads your invoices, expenses and bills to answer, and never invents a figure.</li>
            <li>Rules come from {rules.askSources}; links go to official pages.</li>
            <li>Every answer is marked as AI. It explains; it never files a return or changes your books.</li>
            <li>For anything that needs judgement, ask your {practitioner}.</li>
          </ul>
        </section>
      </aside>
    </div>
    </>
  );
}
