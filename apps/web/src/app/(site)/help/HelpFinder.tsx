"use client";

import Link from "next/link";
import { useId, useState } from "react";

export type FinderAnswer = { id: string; q: string; a: string; topic: string; link?: { label: string; href: string }; words: string };

/**
 * The help centre search: type, or tap a suggestion, and matching answers
 * appear right under the box, in full.
 */
export function HelpFinder({ answers, tries, help }: { answers: FinderAnswer[]; tries: string[]; help: string }) {
  const [q, setQ] = useState("");
  const id = useId();
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const hits = words.length
    ? answers
        .map((x) => {
          const hay = `${x.q} ${x.words} ${x.topic}`.toLowerCase();
          const body = x.a.toLowerCase();
          const score = words.reduce((n, w) => n + (hay.includes(w) ? 3 : body.includes(w) ? 1 : 0), 0);
          const all = words.every((w) => hay.includes(w) || body.includes(w));
          return { x, score: all ? score : 0 };
        })
        .filter((r) => r.score > 0)
        .sort((m, n) => n.score - m.score)
        .slice(0, 5)
    : [];

  return (
    <div className="flex w-full max-w-[640px] flex-col gap-4">
      <label htmlFor={id} className="relative flex items-center">
        <span className="sr-only">Search the help centre</span>
        <svg className="pointer-events-none absolute left-5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#18161F" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id={id}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search, e.g. “${tries[0]}”`}
          aria-controls={`${id}-r`}
          className="min-h-[60px] w-full rounded-full border-2 border-ink bg-white pl-14 pr-5 text-[17px] outline-none focus:shadow-[0_0_0_4px_#EEE8FF]"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Try</span>
        {tries.map((t) => (
          <button key={t} type="button" onClick={() => setQ(t)} className="min-h-10 rounded-full border border-line bg-white px-3.5 text-sm font-semibold hover:border-input">
            {t}
          </button>
        ))}
      </div>
      <div id={`${id}-r`} aria-live="polite">
        {words.length > 0 &&
          (hits.length > 0 ? (
            <ul className="flex flex-col gap-2.5 rounded-3xl border border-line bg-white p-3">
              {hits.map(({ x }) => (
                <li key={x.id} className="flex flex-col gap-1.5 rounded-2xl p-3 hover:bg-bg">
                  <span className="text-xs font-bold uppercase tracking-[0.06em] text-coming">{x.topic}</span>
                  <span className="text-base font-bold">{x.q}</span>
                  <span className="text-[15px] leading-normal text-ink2">{x.a}</span>
                  {x.link && (
                    <Link href={x.link.href} className="inline-flex min-h-8 items-center self-start text-sm font-bold underline underline-offset-[3px]">
                      {x.link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-3xl border border-line bg-white p-5 text-[15px] leading-normal text-ink2">
              No answer matches “{q}” yet. Write to{" "}
              <a href={`mailto:${help}`} className="font-bold text-ink underline underline-offset-[3px]">
                {help}
              </a>{" "}
              and a person will reply.
            </p>
          ))}
      </div>
    </div>
  );
}
