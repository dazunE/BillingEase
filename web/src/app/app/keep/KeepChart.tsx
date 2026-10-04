import type { KeepMonth } from "@/lib/ops-keep";
import { formatMoney } from "@/lib/money";

const H = 180;

function short(cents: number) {
  const v = cents / 100;
  const abs = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(abs >= 100000 ? 0 : 1)}k`;
  return `${sign}$${Math.round(abs)}`;
}

/** Yours to keep per month: one series, one color, every bar labelled, with a table alternative. */
export function KeepChart({ series, year }: { series: KeepMonth[]; year: string }) {
  const posMax = Math.max(0, ...series.map((m) => m.keep));
  const negMax = Math.max(0, ...series.map((m) => -m.keep));
  const total = posMax + negMax || 1;
  // Leave room above (and below, for losses) for the value labels.
  const zero = (posMax / total) * H;
  const title = (m: KeepMonth) => `${m.current ? `${m.label} so far` : `${m.label} ${m.month.slice(0, 4)}`}: ${formatMoney(m.keep, { cents: false })}`;

  return (
    <div className="flex flex-col gap-3">
      <div role="img" aria-label={`Yours to keep per month: ${series.map(title).join(", ")}`} className="flex flex-col gap-2">
        <div className="relative" style={{ height: H + 44 }}>
          {/* baseline at $0 */}
          <div className="absolute inset-x-0 border-t border-line" style={{ top: 22 + zero }} aria-hidden />
          <div className="absolute inset-x-0 flex gap-[clamp(6px,2vw,18px)]" style={{ top: 22, height: H }}>
            {series.map((m) => {
              const h = Math.max(m.keep === 0 ? 0 : 3, (Math.abs(m.keep) / total) * H);
              const neg = m.keep < 0;
              return (
                <div key={m.month} className="group relative min-w-0 flex-1" title={title(m)}>
                  <div
                    className="absolute left-1/2 w-full max-w-14 -translate-x-1/2 bg-coming group-hover:bg-[#6446e6]"
                    style={{
                      top: neg ? zero : zero - h,
                      height: h,
                      borderRadius: neg ? "0 0 4px 4px" : "4px 4px 0 0",
                    }}
                  />
                  <span
                    className="absolute inset-x-0 whitespace-nowrap text-center text-xs font-semibold text-ink tabular"
                    style={neg ? { top: zero + h + 4 } : { top: zero - h - 18 }}
                  >
                    {short(m.keep)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-[clamp(6px,2vw,18px)]" aria-hidden>
          {series.map((m) => (
            <span key={m.month} className="flex min-w-0 flex-1 flex-col items-center whitespace-nowrap text-xs leading-tight text-muted">
              <span className={m.current ? "font-semibold text-ink" : undefined}>{m.label}</span>
              <span>{m.current ? "so far" : " "}</span>
            </span>
          ))}
        </div>
      </div>
      <p className="text-[13px] text-ink2">
        Finished months count money that moved in and out of your accounts. {series.at(-1)?.label} so far also counts money on the way and bills still to pay.
      </p>
      <details className="text-sm">
        <summary className="inline-flex min-h-9 cursor-pointer items-center font-semibold underline underline-offset-4">Show as a table</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left tabular">
            <caption className="sr-only">Yours to keep per month, {year}</caption>
            <thead className="text-xs text-muted">
              <tr className="border-b border-line">
                <th scope="col" className="py-2 font-semibold">Month</th>
                <th scope="col" className="py-2 text-right font-semibold">Coming in</th>
                <th scope="col" className="py-2 text-right font-semibold">Going out</th>
                <th scope="col" className="py-2 text-right font-semibold">Set aside for tax</th>
                <th scope="col" className="py-2 text-right font-semibold">Yours to keep</th>
              </tr>
            </thead>
            <tbody>
              {series.map((m) => (
                <tr key={m.month} className="border-b border-divider">
                  <th scope="row" className="py-2 font-semibold">
                    {m.label} {m.month.slice(0, 4)}
                    {m.current && <span className="font-normal text-muted"> (so far)</span>}
                  </th>
                  <td className="py-2 text-right">{formatMoney(m.comingIn)}</td>
                  <td className="py-2 text-right">{formatMoney(m.goingOut)}</td>
                  <td className="py-2 text-right">{formatMoney(m.tax)}</td>
                  <td className="py-2 text-right font-bold">{formatMoney(m.keep)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
