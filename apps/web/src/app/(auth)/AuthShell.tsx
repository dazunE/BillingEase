import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui";

export function AuthShell({ title, subtitle, children, aside }: { title: string; subtitle: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-wrap">
      <div className="flex flex-[999_1_480px] flex-col gap-10 px-[clamp(16px,5vw,64px)] py-8">
        <Link href="/" aria-label="BillingEase home" className="self-start">
          <Logo />
        </Link>
        <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center gap-7 pb-10">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[34px] font-bold leading-[1.1] tracking-[-0.03em]">{title}</h1>
            <p className="text-[15px] text-ink2">{subtitle}</p>
          </div>
          {children}
        </main>
      </div>
      {aside && <aside className="flex flex-[1_1_420px] items-center justify-center bg-ink px-8 py-12 text-white">{aside}</aside>}
    </div>
  );
}
