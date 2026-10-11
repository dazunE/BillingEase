import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { InvoiceDocument } from "@/components/in/InvoiceDocument";
import { DownloadPdfLink } from "@/components/in/DownloadPdfLink";
import { PrintButton } from "@/components/in/PrintButton";
import { ICONS, Icon } from "@/components/ui";
import { requireBusiness } from "@/lib/auth";
import { invoiceDetail } from "@/lib/ops-in";
import { PRINT_CSS } from "@/components/in/print";

export const metadata: Metadata = { title: "Print invoice" };

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { business, db } = await requireBusiness();
  const d = await invoiceDetail(db, business.id, id);
  if (!d) notFound();
  return (
    <>
      <style>{PRINT_CSS}</style>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/app/invoices/${d.invoice.id}`} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold">
          <Icon d={ICONS.arrowLeft} size={16} />
          Back to {d.invoice.number}
        </Link>
        <div className="flex flex-wrap gap-2">
          <DownloadPdfLink href={`/app/invoices/${d.invoice.id}/pdf`} />
          <PrintButton />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[820px]">
        <InvoiceDocument doc={d} className="print-sheet" />
      </div>
    </>
  );
}
