import type { Metadata } from "next";
import { AuthShell } from "../AuthShell";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <AuthShell
      title="See your three numbers"
      subtitle="Free to start. No card needed."
      aside={
        <div className="flex max-w-sm flex-col gap-5">
          <p className="font-display text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-violet">Coming in − Going out = Yours to keep.</p>
          <p className="text-[15px] leading-relaxed text-tint">BillingEase keeps the books underneath. You see three numbers and a short list of things that need you.</p>
        </div>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
