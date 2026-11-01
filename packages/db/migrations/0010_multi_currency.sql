CREATE TABLE "fx_rates" (
	"day" date NOT NULL,
	"base" text NOT NULL,
	"quote" text NOT NULL,
	"rate" numeric(22, 10) NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fx_rates_day_base_quote_pk" PRIMARY KEY("day","base","quote"),
	CONSTRAINT "fx_rates_positive" CHECK ("fx_rates"."rate" > 0)
);
--> statement-breakpoint
ALTER TABLE "bill_payments" ADD COLUMN "home_amount" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD COLUMN "home_cleared" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "currency" text;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "fx_rate" numeric(22, 10) DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "home_net" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "home_vat" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "home_total" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN "home_cleared" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "currency" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "currency" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "fx_rate" numeric(22, 10);--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "original_gross" bigint;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "original_vat" bigint;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "currency" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "fx_rate" numeric(22, 10) DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "home_net" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "home_vat" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "home_sscl" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "home_total" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "home_cleared" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "currency" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "fx_rate" numeric(22, 10) DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "home_total" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "home_amount" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "receipts" ADD COLUMN "home_cleared" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_invoices" ADD COLUMN "currency" text;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "currency" text;--> statement-breakpoint
-- Everything written before this migration is in the business's home currency, at a rate of 1.
UPDATE "invoices" SET "currency" = b."currency", "home_net" = "invoices"."net", "home_vat" = "invoices"."vat", "home_sscl" = "invoices"."sscl", "home_total" = "invoices"."total",
  "home_cleared" = "invoices"."paid" + "invoices"."credited" FROM "businesses" b WHERE b."id" = "invoices"."business_id";--> statement-breakpoint
UPDATE "quotes" SET "currency" = b."currency", "home_total" = "quotes"."total" FROM "businesses" b WHERE b."id" = "quotes"."business_id";--> statement-breakpoint
UPDATE "recurring_invoices" SET "currency" = b."currency" FROM "businesses" b WHERE b."id" = "recurring_invoices"."business_id";--> statement-breakpoint
UPDATE "bills" SET "currency" = b."currency", "home_net" = "bills"."net", "home_vat" = "bills"."vat", "home_total" = "bills"."total", "home_cleared" = "bills"."paid"
  FROM "businesses" b WHERE b."id" = "bills"."business_id";--> statement-breakpoint
UPDATE "receipts" SET "home_amount" = "amount", "home_cleared" = "amount";--> statement-breakpoint
UPDATE "bill_payments" SET "home_amount" = "amount", "home_cleared" = "amount";--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "currency" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ALTER COLUMN "currency" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_invoices" ALTER COLUMN "currency" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bills" ALTER COLUMN "currency" SET NOT NULL;--> statement-breakpoint
-- Exchange rate differences need their own income account in every existing business.
INSERT INTO "accounts" ("business_id", "code", "name", "type", "role")
  SELECT b."id", '4800', 'Exchange rate gains and losses', 'income', 'fx' FROM "businesses" b
  WHERE NOT EXISTS (SELECT 1 FROM "accounts" a WHERE a."business_id" = b."id" AND a."code" = '4800');--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_fx" CHECK ("bills"."fx_rate" > 0 and "bills"."home_cleared" >= 0 and "bills"."home_cleared" <= "bills"."home_total");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_fx" CHECK ("invoices"."fx_rate" > 0 and "invoices"."home_cleared" >= 0 and "invoices"."home_cleared" <= "invoices"."home_total");