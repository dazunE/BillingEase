import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { Button, Card, ICONS, Icon } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, business } = await requireBusiness();
  return (
    <>
      <Link href="/app" className="inline-flex min-h-10 items-center gap-1.5 self-start text-sm font-semibold">
        <Icon d={ICONS.arrowLeft} size={16} />
        Home
      </Link>
      <h1 className="font-display text-[clamp(28px,3.4vw,40px)] font-bold leading-tight tracking-[-0.03em]">Settings</h1>
      <div className="flex flex-wrap items-start gap-6">
        <Card className="flex min-w-0 flex-[2_1_440px] flex-col gap-5 p-[clamp(18px,2.5vw,28px)]">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">Your business</h2>
          <SettingsForm initial={{ name: business.name, invoicePrefix: business.invoicePrefix, taxRatePct: String(business.taxRateBps / 100) }} />
        </Card>
        <Card className="flex min-w-0 flex-[1_1_300px] flex-col gap-4 p-[clamp(18px,2.5vw,28px)]">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">Your account</h2>
          <dl className="flex flex-col gap-3 text-[15px]">
            <div className="flex flex-col">
              <dt className="text-[13px] font-semibold text-muted">Name</dt>
              <dd>{user.name}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-[13px] font-semibold text-muted">Email</dt>
              <dd className="break-all">{user.email}</dd>
            </div>
          </dl>
          <form action={logout}>
            <Button variant="outline">Sign out</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
