import type { FastifyInstance } from "fastify";
import { outboxAttachments } from "../services/invoice-pdf";
import { customerEmailExtras } from "../services/email-html";
import { customerRoutes } from "./coming-in/customers";
import { fxRoutes } from "./coming-in/fx";
import { invoiceRoutes } from "./coming-in/invoices";
import { quoteRoutes } from "./coming-in/quotes";
import { recurringRoutes } from "./coming-in/recurring";
import { summaryRoutes } from "./coming-in/summary";

/** Coming in: customers, prices, invoices, payments, credit notes, quotes and repeating invoices. */
export async function comingInRoutes(app: FastifyInstance) {
  // Invoice and quote PDFs are attached to outbox emails when they're sent.
  app.be.services.email.setRenderer((db, m) => outboxAttachments(db, m, app.be.services.storage));
  // And go out as HTML in the business's colours, with its logo.
  app.be.services.email.setExtras((db, m) => customerEmailExtras(db, m, app.be.services.storage));
  await summaryRoutes(app);
  await fxRoutes(app);
  await customerRoutes(app);
  await invoiceRoutes(app);
  await quoteRoutes(app);
  await recurringRoutes(app);
}
