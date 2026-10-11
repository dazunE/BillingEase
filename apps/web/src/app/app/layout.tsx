import { AppHeader } from "@/components/AppHeader";
import { requireBusiness } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { me, business } = await requireBusiness();
  return (
    <div className="min-h-screen bg-bg">
      <AppHeader userName={me.user.name} businessName={business.name} country={business.country} />
      <main className="mx-auto flex max-w-[1200px] flex-col gap-7 px-[clamp(16px,4vw,40px)] pb-16 pt-9">{children}</main>
    </div>
  );
}
