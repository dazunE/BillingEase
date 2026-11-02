"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { accept } from "./actions";

export function AcceptButton({ token, label }: { token: string; label: string }) {
  const [state, action, pending] = useActionState(accept, undefined);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <Button disabled={pending} className="self-start">{pending ? "Opening…" : label}</Button>
      {state?.message && <p role="alert" className="text-sm font-semibold text-late">{state.message}</p>}
    </form>
  );
}
