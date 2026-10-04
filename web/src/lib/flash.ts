import { redirect } from "next/navigation";

/** Redirects and shows a short confirmation toast on the next page. */
export function redirectWithFlash(path: string, message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}flash=${encodeURIComponent(message)}`);
}

/** Base URL for links in emails (pay links). Set APP_URL in production. */
export function appUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}
