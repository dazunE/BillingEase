import type { AskMessage } from "@billingease/contracts";
import { Fragment } from "react";
import { ICONS, Icon } from "@/components/ui";

/** Splits "text [1] more [2]" into text and citation chips that jump to the source. */
function withCitations(text: string, prefix: string) {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((p, i) => {
    const m = /^\[(\d+)\]$/.exec(p);
    if (!m) return <Fragment key={i}>{p}</Fragment>;
    return (
      <a key={i} href={`#${prefix}-src-${m[1]}`} aria-label={`Source ${m[1]}`} className="mx-0.5 inline-flex min-w-5 items-center justify-center rounded-md bg-tint px-1 align-[1px] text-[11px] font-bold no-underline">{m[1]}</a>
    );
  });
}

export function Answer({ question, answer, practitioner, latest }: { question: string; answer: AskMessage; practitioner: string; latest?: boolean }) {
  const prefix = answer.id.slice(0, 8);
  const paras = answer.content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const books = answer.sources.filter((s) => s.kind === "books");
  const official = answer.sources.filter((s) => s.kind === "official");
  return (
    <article id={latest ? "latest" : undefined} className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(18px,3vw,26px)]">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-muted">You asked</span>
        <h2 className="font-display text-lg font-bold tracking-[-0.02em]">{question}</h2>
      </div>
      <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-info-bg px-2.5 py-1 text-xs font-bold text-info">
        <span className="size-1.5 rounded-full bg-current" aria-hidden />AI answer · check with your {practitioner}
      </span>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed">
        {paras.map((p, i) => <p key={i} className="whitespace-pre-line">{withCitations(p, prefix)}</p>)}
      </div>
      {answer.sources.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl bg-bg p-4">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">Sources</span>
          <ol className="flex flex-col gap-2 text-sm">
            {[...books, ...official].sort((a, z) => a.n - z.n).map((s) => (
              <li key={s.n} id={`${prefix}-src-${s.n}`} className="flex items-start gap-2.5">
                <span className="flex size-6 flex-none items-center justify-center rounded-md bg-white text-xs font-bold">{s.n}</span>
                <span className="flex min-w-0 flex-col">
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-4 [overflow-wrap:anywhere]">
                      {s.title}<Icon d={ICONS.arrowRight} size={14} className="-rotate-45" />
                    </a>
                  ) : <span className="font-semibold">{s.title}</span>}
                  <span className="text-xs text-muted">{s.kind === "books" ? "From your books in BillingEase" : "Official guidance"}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {answer.model && <span className="text-[11px] text-muted">Answered by {answer.model}. It explains; it never files anything or changes your books.</span>}
    </article>
  );
}
