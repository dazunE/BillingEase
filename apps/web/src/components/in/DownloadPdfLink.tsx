import { ICONS, Icon, cx } from "@/components/ui";

/** Downloads the invoice as a real PDF file (not the browser's print dialog). */
export function DownloadPdfLink({ href, className }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      download
      className={cx("inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-semibold text-white hover:bg-black print:hidden", className)}
    >
      <Icon d={ICONS.download} size={18} />
      Download PDF
    </a>
  );
}
