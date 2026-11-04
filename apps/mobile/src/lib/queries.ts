import type { PeriodKey } from "@billingease/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { todayIso } from "./dates";
import { useSession } from "./session";

/** Every read the screens make, cached per business; writes refresh what they change. */
export function useData() {
  const { api, business, stage } = useSession();
  const b = business?.id ?? "none";
  // Nothing loads until the person is signed in, has a business and has unlocked the app.
  const enabled = stage === "ready" && !!business;
  const q = <T,>(o: T) => ({ ...o, enabled });
  return {
    home: (period?: PeriodKey) => q({ queryKey: [b, "home", period ?? "default"], queryFn: () => api("home", { query: period ? { period } : {} }) }),
    business: () => q({ queryKey: [b, "business"], queryFn: () => api("business") }),
    invoices: (status: "all" | "draft" | "unpaid" | "late" | "paid") => q({ queryKey: [b, "invoices", status], queryFn: () => api("invoices", { query: { status } }) }),
    customers: () => q({ queryKey: [b, "customers"], queryFn: () => api("customers") }),
    items: () => q({ queryKey: [b, "items"], queryFn: () => api("items") }),
    outSetup: () => q({ queryKey: [b, "outSetup"], queryFn: () => api("outSetup"), staleTime: 60 * 60_000 }),
    expenses: (from: string) => q({ queryKey: [b, "expenses", from], queryFn: () => api("expenses", { query: { from, limit: 100 } }) }),
    bills: () => q({ queryKey: [b, "bills"], queryFn: () => api("bills", { query: { status: "open" } }) }),
    notifications: () => q({ queryKey: [b, "notifications"], queryFn: () => api("notifications", { query: { filter: "all" } }) }),
  };
}

export function useHome(period?: PeriodKey) { return useQuery(useData().home(period)); }
/**
 * Today as BillingEase's books see it. The API refuses dates after its own today, and a phone
 * ahead of the server's time zone (Sri Lanka at night) would otherwise send tomorrow.
 */
export function useToday() { return useHome().data?.today ?? todayIso(); }
export function useBusiness() { return useQuery({ ...useData().business(), staleTime: 10 * 60_000 }); }
export function useInvoices(status: "all" | "draft" | "unpaid" | "late" | "paid") { return useQuery(useData().invoices(status)); }
export function useCustomers() { return useQuery(useData().customers()); }
export function useItems() { return useQuery(useData().items()); }
export function useOutSetup() { return useQuery(useData().outSetup()); }
export function useExpenses(from: string) { return useQuery(useData().expenses(from)); }
export function useBills() { return useQuery(useData().bills()); }
export function useNotifications() { return useQuery(useData().notifications()); }

/** After a write, everything that shows money can be out of date: refresh it all for this business. */
export function useRefreshAll() {
  const qc = useQueryClient();
  const { business } = useSession();
  return () => qc.invalidateQueries({ queryKey: [business?.id ?? "none"] });
}

/** A write that refreshes the screens when it's done. */
export function useWrite<A, R>(fn: (a: A) => Promise<R>) {
  const refresh = useRefreshAll();
  return useMutation({ mutationFn: fn, onSuccess: () => refresh() });
}
