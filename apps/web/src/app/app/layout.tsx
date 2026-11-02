import { AppHeader } from "@/components/AppHeader";
import { BottomIsland } from "@/components/app/BottomIsland";
import { homeSummary, pendingProposals } from "@/lib/counts";
import { requireBusiness } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { me, business } = await requireBusiness();
  const [summary, toCheck] = await Promise.all([homeSummary(), pendingProposals()]);
  const counts = {
    lateInvoices: summary?.comingIn.lateCount ?? 0,
    billsDueSoon: summary?.goingOut.dueSoonCount ?? 0,
    toCheck,
  };
  return (
    <div className="min-h-screen bg-bg">
      <AppHeader userName={me.user.name} email={me.user.email} business={business} businesses={me.businesses} />
      {/* Room at the foot of every page so the bottom island never covers the last thing on it. */}
      <main className="mx-auto flex max-w-[1200px] flex-col gap-7 px-[clamp(16px,4vw,40px)] pb-32 pt-9">{children}</main>
      <BottomIsland country={business.country} vatRegistered={business.vatRegistered} ssclRegistered={business.ssclRegistered} landlord={business.kind === "landlord" || business.kind === "both"} counts={counts} />
    </div>
  );
}
