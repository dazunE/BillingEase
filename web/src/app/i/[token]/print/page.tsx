import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { InvoiceDocument } from "@/components/in/InvoiceDocument";
import { PRINT_CSS } from "@/components/in/print";
import { DownloadPdfLink } from "@/components/in/DownloadPdfLink";
import { PrintButton } from "@/components/in/PrintButton";
import { ICONS, Icon } from "@/components/ui";
import { invoiceByToken } from "@/lib/ops-in";

export const metadata: Metadata = { title: "Invoice", robots: { index: false, follow: false } };

export default async function PublicPrintPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await invoiceByToken(await getDb(), token);
  if (!d) notFound();
  return (
    <main className="mx-auto flex w-full max-w-[860px] flex-col gap-5 px-4 py-8 print:p-0">
      <style>{PRINT_CSS}</style>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/i/${token}`} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold">
          <Icon d={ICONS.arrowLeft} size={16} />
          {d.invoice.status === "paid" ? "Back" : "Back to pay"}
        </Link>
        <div className="flex flex-wrap gap-2">
          <DownloadPdfLink href={`/i/${token}/pdf`} />
          <PrintButton />
        </div>
      </div>
      <InvoiceDocument doc={d} className="print-sheet" />
    </main>
  );
}
