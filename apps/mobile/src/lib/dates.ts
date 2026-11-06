const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Today on this phone, as 2026-10-11. */
export function todayIso(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return todayIso(new Date(y, m - 1, d + days));
}

/** "11 Oct" from 2026-10-11. */
export function shortDate(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MON[m - 1]}`;
}

/** The first of the month an ISO date is in. */
export function monthStart(iso: string) {
  return iso.slice(0, 8) + "01";
}

/** "Just now", "5 min ago", "3 h ago", "2 days ago" or the date. */
export function ago(at: string, now = Date.now()) {
  const mins = Math.round((now - new Date(at).getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return shortDate(new Date(at).toISOString().slice(0, 10));
}

/** "Good morning" / "Good afternoon" / "Good evening". */
export function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
