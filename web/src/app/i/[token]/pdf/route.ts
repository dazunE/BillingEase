import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { baseUrl } from "@/app/app/in/run";
import { invoicePdfFilename, renderInvoicePdf } from "@/lib/invoice-pdf";
import { invoiceByToken } from "@/lib/ops-in";
import { pdfResponse } from "@/lib/pdf-response";

/** The invoice as a PDF for the customer, by its unguessable pay-link token. */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await invoiceByToken(await getDb(), token);
  if (!d) notFound();
  const bytes = await renderInvoicePdf({ ...d, payLink: `${await baseUrl()}/i/${token}` });
  return pdfResponse(bytes, invoicePdfFilename(d.invoice), request);
}
