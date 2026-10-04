import { notFound } from "next/navigation";
import { z } from "zod";
import { requireBusiness } from "@/lib/auth";
import { invoicePdf } from "@/lib/email";
import { pdfResponse } from "@/lib/pdf-response";
import { baseUrl } from "../../../in/run";

/** The invoice as a PDF, for the signed-in owner (drafts included). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { business, db } = await requireBusiness();
  const pdf = await invoicePdf(db, business.id, id, await baseUrl());
  if (!pdf) notFound();
  return pdfResponse(pdf.bytes, pdf.filename, request);
}
