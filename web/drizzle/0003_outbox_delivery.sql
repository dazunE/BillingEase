ALTER TABLE "outbox_emails" ADD COLUMN "invoice_id" uuid;--> statement-breakpoint
ALTER TABLE "outbox_emails" ADD COLUMN "status" text DEFAULT 'kept' NOT NULL;--> statement-breakpoint
ALTER TABLE "outbox_emails" ADD COLUMN "error" text;--> statement-breakpoint
ALTER TABLE "outbox_emails" ADD COLUMN "sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "outbox_emails" ADD CONSTRAINT "outbox_emails_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "outbox_status" ON "outbox_emails" USING btree ("status");--> statement-breakpoint
ALTER TABLE "outbox_emails" ADD CONSTRAINT "outbox_status_valid" CHECK ("outbox_emails"."status" in ('kept','queued','sending','sent','failed'));