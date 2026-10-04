import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Flash } from "@/components/Flash";
import { requireBusiness } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, business } = await requireBusiness();
  return (
    <div className="min-h-screen bg-bg">
      <AppHeader userName={user.name} businessName={business.name} />
      <main className="mx-auto flex max-w-[1200px] flex-col gap-7 px-[clamp(16px,4vw,40px)] pb-16 pt-9">{children}</main>
      <Suspense>
        <Flash />
      </Suspense>
    </div>
  );
}
