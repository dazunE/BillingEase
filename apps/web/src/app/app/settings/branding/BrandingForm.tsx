"use client";

import { FONTS, LOGO_MAX_BYTES, TEMPLATES, type Business } from "@billingease/contracts";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState, useTransition } from "react";
import { DocPreview, type PreviewData } from "@/components/in/DocPreview";
import { FONT_STACKS, LOGO_URL, type PreviewBrand } from "@/components/in/brand";
import { Button, Field, Input, cx } from "@/components/ui";
import { saveBranding } from "./actions";

const SWATCHES = [
  { value: "#7A5AF8", name: "Violet" },
  { value: "#18161F", name: "Graphite" },
  { value: "#1F5E91", name: "Blue" },
  { value: "#0F766E", name: "Teal" },
  { value: "#2F7D5B", name: "Green" },
  { value: "#C2410C", name: "Orange" },
  { value: "#A8200D", name: "Red" },
  { value: "#B45309", name: "Amber" },
];

const LAYOUTS: Record<PreviewBrand["template"], { name: string; line: string }> = {
  classic: { name: "Classic", line: "Logo top left, title in your colour" },
  modern: { name: "Modern", line: "A band of your colour across the top" },
  minimal: { name: "Minimal", line: "Quiet: big title, logo on the right" },
};

const TYPEFACES: Record<PreviewBrand["font"], { name: string; line: string }> = {
  sans: { name: "DM Sans", line: "Clean and friendly" },
  serif: { name: "Source Serif", line: "Traditional, like a letter" },
  mono: { name: "JetBrains Mono", line: "Technical, typewriter feel" },
};

/** A tiny drawing of each layout, for its card. */
function Thumb({ t, accent }: { t: PreviewBrand["template"]; accent: string }) {
  const bar = "block h-[3px] rounded-full bg-line";
  return (
    <span aria-hidden className="relative flex h-[74px] w-full flex-col gap-1.5 overflow-hidden rounded-lg border border-line bg-white p-2">
      {t === "modern" && <span className="-mx-2 -mt-2 mb-0.5 flex h-5 items-center justify-between px-2" style={{ background: accent }}><span className="h-2 w-6 rounded-sm bg-white" /><span className="h-1.5 w-8 rounded-full bg-white/80" /></span>}
      {t === "classic" && <span className="flex items-center justify-between"><span className="h-3 w-7 rounded-sm bg-ink/70" /><span className="h-2 w-10 rounded-full" style={{ background: accent }} /></span>}
      {t === "minimal" && <span className="flex items-start justify-between"><span className="flex flex-col gap-1"><span className="h-2.5 w-11 rounded-full bg-ink/80" /><span className="h-[2px] w-4" style={{ background: accent }} /></span><span className="h-3 w-7 rounded-sm bg-ink/70" /></span>}
      <span className={cx(bar, "w-2/3")} /><span className={bar} /><span className={bar} />
      <span className="ml-auto h-1.5 w-10 rounded-full" style={{ background: t === "classic" ? "#18161F" : accent }} />
    </span>
  );
}

export function BrandingForm({ b, sample, canEdit }: { b: Business; sample: PreviewData; canEdit: boolean }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveBranding, undefined);
  const v = state?.values;
  const e = state?.errors ?? {};
  const [template, setTemplate] = useState<PreviewBrand["template"]>((v?.template as PreviewBrand["template"]) ?? b.template);
  const [font, setFont] = useState<PreviewBrand["font"]>((v?.font as PreviewBrand["font"]) ?? b.font);
  const [accent, setAccent] = useState((v?.accent ?? b.accent).toUpperCase());
  const [footer, setFooter] = useState(v?.footer ?? b.footer ?? "");
  const [logo, setLogo] = useState<{ has: boolean; version: string | null }>({ has: b.hasLogo, version: b.logoVersion });
  const [logoMsg, setLogoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploading, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const hexOk = /^#[0-9A-F]{6}$/.test(accent);

  const brand: PreviewBrand = { template, font, accent: hexOk ? accent : b.accent, footer: footer || null, logoUrl: logo.has ? `${LOGO_URL}?v=${logo.version ?? ""}` : null };

  function upload(file: File | undefined) {
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) return setLogoMsg({ ok: false, text: "Use a PNG or JPEG. A PNG with a transparent background looks best." });
    if (file.size > LOGO_MAX_BYTES) return setLogoMsg({ ok: false, text: "That image is over 1 MB. Save a smaller version and try again." });
    start(async () => {
      const res = await fetch(LOGO_URL, { method: "PUT", body: file, headers: { "content-type": file.type } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setLogoMsg({ ok: false, text: json.message ?? "That didn't work. Try again." });
      setLogo({ has: true, version: json.logoVersion });
      setLogoMsg({ ok: true, text: "Logo saved. It's on your documents now." });
      router.refresh();
    });
  }

  function removeLogo() {
    start(async () => {
      const res = await fetch(LOGO_URL, { method: "DELETE" });
      if (!res.ok) return setLogoMsg({ ok: false, text: "That didn't work. Try again." });
      setLogo({ has: false, version: null });
      setLogoMsg({ ok: true, text: "Logo removed." });
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  }

  const card = (on: boolean) => cx("flex cursor-pointer flex-col gap-2 rounded-2xl border-2 p-3 text-left has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-coming",
    on ? "border-ink bg-tint" : "border-line bg-white hover:border-input");

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,460px)]">
      <div className="flex min-w-0 flex-col gap-5">
        <section className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-[clamp(16px,3vw,28px)]" aria-labelledby="logo-h">
          <h2 id="logo-h" className="text-[20px] font-bold">Logo</h2>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-20 w-44 items-center justify-center rounded-2xl border border-dashed border-input bg-bg p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logo.has ? <img src={brand.logoUrl!} alt="Your logo" className="max-h-full max-w-full object-contain" data-testid="logo-img" /> : <span className="text-sm text-muted">No logo yet</span>}
            </span>
            {canEdit && (
              <div className="flex flex-col gap-2">
                <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-ink px-5 font-semibold text-white has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-coming">
                  {uploading ? "Saving…" : logo.has ? "Change logo" : "Upload a logo"}
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="sr-only" aria-label="Logo image" disabled={uploading}
                    onChange={(ev) => upload(ev.target.files?.[0])} />
                </label>
                {logo.has && <button type="button" onClick={removeLogo} disabled={uploading} className="min-h-9 self-start text-sm font-semibold text-late underline underline-offset-4">Remove logo</button>}
              </div>
            )}
          </div>
          <p className="text-[13px] text-muted">PNG or JPEG, up to 1 MB. A wide logo on a transparent background works best; it&apos;s shown up to about 160 by 50 points on A4.</p>
          {logoMsg && <p role={logoMsg.ok ? "status" : "alert"} className={cx("rounded-xl px-4 py-3 text-sm font-semibold", logoMsg.ok ? "bg-pos-bg text-pos" : "bg-late-bg text-late")}>{logoMsg.text}</p>}
        </section>

        <form action={action} noValidate className="flex flex-col gap-5">
          {state?.message && <p role={state.ok ? "status" : "alert"} className={cx("rounded-xl px-4 py-3 text-sm font-semibold", state.ok ? "bg-pos-bg text-pos" : "bg-late-bg text-late")}>{state.message}</p>}
          <fieldset disabled={!canEdit} className="flex flex-col gap-5 rounded-3xl border border-line bg-white p-[clamp(16px,3vw,28px)]">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[20px] font-bold">Layout</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {TEMPLATES.map((t) => (
                  <label key={t} className={card(template === t)}>
                    <input type="radio" name="template" value={t} checked={template === t} onChange={() => setTemplate(t)} className="sr-only" />
                    <Thumb t={t} accent={brand.accent} />
                    <span className="font-bold">{LAYOUTS[t].name}</span>
                    <span className="text-xs text-muted">{LAYOUTS[t].line}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[20px] font-bold">Colour</legend>
              <div className="flex flex-wrap items-center gap-2">
                {SWATCHES.map((s) => (
                  <label key={s.value} title={s.name} className={cx("flex size-11 cursor-pointer items-center justify-center rounded-full border-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-coming", accent === s.value ? "border-ink" : "border-transparent")}>
                    <input type="radio" name="swatch" checked={accent === s.value} onChange={() => setAccent(s.value)} className="sr-only" aria-label={s.name} />
                    <span className="size-8 rounded-full" style={{ background: s.value }} />
                  </label>
                ))}
                <label className="ml-1 flex items-center gap-2 text-sm font-semibold">
                  <input type="color" value={hexOk ? accent : "#7A5AF8"} onChange={(ev) => setAccent(ev.target.value.toUpperCase())} className="size-11 cursor-pointer rounded-full border border-line bg-white p-1" aria-label="Pick any colour" />
                  <span className="w-28"><Input name="accent" value={accent} onChange={(ev) => setAccent(ev.target.value.trim().toUpperCase())} aria-label="Colour as a hex code" maxLength={7} aria-invalid={!hexOk || !!e.accent} /></span>
                </label>
              </div>
              {(!hexOk || e.accent) && <span className="text-xs font-semibold text-late">{e.accent ?? "Use a colour like #7A5AF8"}</span>}
              <span className="text-xs text-muted">Your brand colour, on documents and emails. Light colours are darkened for text so totals stay readable.</span>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-[20px] font-bold">Typeface</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {FONTS.map((f) => (
                  <label key={f} className={card(font === f)}>
                    <input type="radio" name="font" value={f} checked={font === f} onChange={() => setFont(f)} className="sr-only" />
                    <span className="text-[28px] font-bold leading-none" style={{ fontFamily: FONT_STACKS[f] }} aria-hidden>Aa</span>
                    <span className="font-bold">{TYPEFACES[f].name}</span>
                    <span className="text-xs text-muted">{TYPEFACES[f].line}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <Field label="Footer line" hint="Optional. At the foot of every page and email, e.g. your company number, website or a thank-you." error={e.footer}>
              <Input name="footer" value={footer} onChange={(ev) => setFooter(ev.target.value.slice(0, 200))} placeholder="e.g. Registered in England 01234567 · nordstar.co.uk" />
            </Field>
          </fieldset>
          {canEdit
            ? <Button disabled={pending || !hexOk} className="self-start">{pending ? "Saving…" : "Save branding"}</Button>
            : <p className="text-sm text-muted">Only the owner can change the branding.</p>}
        </form>
      </div>

      <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-6" aria-label="Preview">
        <div className="rounded-3xl bg-surface p-3">
          <DocPreview d={{ ...sample, brand }} compact />
          <p className="pt-2 text-center text-xs text-muted">A sample invoice in your branding · quotes and credit notes match</p>
        </div>
      </aside>
    </div>
  );
}
