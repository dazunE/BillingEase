"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * The header's menus are <details> elements in the persistent layout. This closes them when
 * the page changes, when a link inside one is clicked, on Escape, and on a click outside.
 */
export function MenuCloser() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    document.querySelectorAll("details[data-menu][open]").forEach((d) => d.removeAttribute("open"));
  }, [pathname, search]);
  useEffect(() => {
    const closeAll = (except?: Element | null) =>
      document.querySelectorAll("details[data-menu][open]").forEach((d) => d !== except && d.removeAttribute("open"));
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element;
      const menu = t.closest("details[data-menu]");
      if (menu && t.closest("a, button[type=submit]")) menu.removeAttribute("open");
      closeAll(menu);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAll();
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  return null;
}
