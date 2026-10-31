import type { FastifyInstance } from "fastify";
import { outboxAttachments } from "../services/invoice-pdf";
import { customerRoutes } from "./coming-in/customers";
import { fxRoutes } from "./coming-in/fx";
import { invoiceRoutes } from "./coming-in/invoices";
import { quoteRoutes } from "./coming-in/quotes";
import { recurringRoutes } from "./coming-in/recurring";
import { summaryRoutes } from "./coming-in/summary";

/** Coming in: customers, prices, invoices, payments, credit notes, quotes and repeating invoices. */
export async function comingInRoutes(app: FastifyInstance) {
  // Invoice and quote PDFs are attached to outbox emails when they're sent.
  app.be.services.email.setRenderer(outboxAttachments);
  await summaryRoutes(app);
  await fxRoutes(app);
  await customerRoutes(app);
  await invoiceRoutes(app);
  await quoteRoutes(app);
  await recurringRoutes(app);
}
