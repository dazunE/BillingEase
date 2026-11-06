/** A web link in a notification, as the screen it means on the phone (or null to stay here). */
export function phoneRoute(link: string | null): string | null {
  if (!link) return null;
  if (link.startsWith("/app/check")) return "/inbox?tab=check";
  if (link.startsWith("/app/budgets")) return "/budgets";
  if (link.startsWith("/app/in")) return link.includes("status=late") ? "/in?status=late" : "/in";
  if (link.startsWith("/app/out/bills")) return "/out?tab=bills";
  if (link.startsWith("/app/out")) return "/out";
  if (link === "/app" || link.startsWith("/app?")) return "/";
  return null;
}
