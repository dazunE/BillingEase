ALTER TABLE "invoice_lines" ADD COLUMN "section" text;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD COLUMN "work_date" date;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD COLUMN "person" text;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD COLUMN "cost_price" bigint;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD COLUMN "markup_bps" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "billing" text DEFAULT 'items' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_lines" ADD COLUMN "section" text;--> statement-breakpoint
ALTER TABLE "quote_lines" ADD COLUMN "work_date" date;--> statement-breakpoint
ALTER TABLE "quote_lines" ADD COLUMN "person" text;--> statement-breakpoint
ALTER TABLE "quote_lines" ADD COLUMN "cost_price" bigint;--> statement-breakpoint
ALTER TABLE "quote_lines" ADD COLUMN "markup_bps" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_billing" CHECK ("invoices"."billing" in ('items','time_materials','fixed'));