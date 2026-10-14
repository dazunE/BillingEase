CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"role" text,
	"category_id" text,
	"official" text,
	"allowable" boolean,
	"scope" text,
	"archived" boolean DEFAULT false NOT NULL,
	CONSTRAINT "accounts_type" CHECK ("accounts"."type" in ('asset','liability','equity','income','expense'))
);
--> statement-breakpoint
CREATE TABLE "activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"actor_id" uuid,
	"message" text NOT NULL,
	"link" text,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ask_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"thread_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"model" text,
	"created_at" timestamp with time zone DEFAULT clock_timestamp() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"owner_type" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"filename" text NOT NULL,
	"mime" text NOT NULL,
	"size" integer NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"bill_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"category_id" text NOT NULL,
	"net" bigint NOT NULL,
	"vat" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"bill_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"paid_on" date NOT NULL,
	"method" text NOT NULL,
	"cheque_number" text,
	"cheque_date" date,
	"cheque_bank" text,
	"reference" text,
	"journal_entry_id" uuid,
	"voided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bill_payments_positive" CHECK ("bill_payments"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"reference" text,
	"bill_date" date NOT NULL,
	"due_date" date NOT NULL,
	"description" text NOT NULL,
	"net" bigint NOT NULL,
	"vat" bigint DEFAULT 0 NOT NULL,
	"total" bigint NOT NULL,
	"paid" bigint DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'unpaid' NOT NULL,
	"journal_entry_id" uuid,
	"voided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bills_status" CHECK ("bills"."status" in ('unpaid','part_paid','paid','void')),
	CONSTRAINT "bills_amounts" CHECK ("bills"."total" > 0 and "bills"."paid" >= 0 and "bills"."paid" <= "bills"."total" and "bills"."total" = "bills"."net" + "bills"."vat")
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"country" text NOT NULL,
	"currency" text NOT NULL,
	"name" text NOT NULL,
	"legal_name" text,
	"kind" text NOT NULL,
	"owner_name" text NOT NULL,
	"email" text,
	"phone" text,
	"address_line1" text,
	"address_line2" text,
	"town" text,
	"region" text,
	"postcode" text,
	"tax_id" text,
	"vat_registered" boolean DEFAULT false NOT NULL,
	"vat_number" text,
	"sscl_registered" boolean DEFAULT false NOT NULL,
	"basis" text NOT NULL,
	"quarter_type" text DEFAULT 'standard' NOT NULL,
	"invoice_prefix" text DEFAULT 'INV-' NOT NULL,
	"next_invoice_no" integer DEFAULT 1 NOT NULL,
	"next_quote_no" integer DEFAULT 1 NOT NULL,
	"next_credit_no" integer DEFAULT 1 NOT NULL,
	"terms_days" integer NOT NULL,
	"invoice_note" text,
	"payment_details" text,
	"accent" text DEFAULT '#7A5AF8' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_country" CHECK ("businesses"."country" in ('uk','lk')),
	CONSTRAINT "businesses_currency" CHECK (("businesses"."country" = 'uk' and "businesses"."currency" = 'GBP') or ("businesses"."country" = 'lk' and "businesses"."currency" = 'LKR')),
	CONSTRAINT "businesses_basis" CHECK ("businesses"."basis" in ('cash','accrual')),
	CONSTRAINT "businesses_terms" CHECK ("businesses"."terms_days" between 0 and 365)
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"email" text,
	"phone" text,
	"address" text,
	"tax_id" text,
	"vat_number" text,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"spent_on" date NOT NULL,
	"supplier_id" uuid,
	"payee" text NOT NULL,
	"category_id" text,
	"gross" bigint NOT NULL,
	"vat" bigint DEFAULT 0 NOT NULL,
	"biz_pct" integer DEFAULT 100 NOT NULL,
	"method" text NOT NULL,
	"cheque_number" text,
	"cheque_date" date,
	"cheque_bank" text,
	"note" text,
	"monthly_cost_id" uuid,
	"journal_entry_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_amounts" CHECK ("expenses"."gross" > 0 and "expenses"."vat" >= 0 and "expenses"."vat" < "expenses"."gross"),
	CONSTRAINT "expenses_biz_pct" CHECK ("expenses"."biz_pct" between 1 and 100)
);
--> statement-breakpoint
CREATE TABLE "invoice_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"item_id" uuid,
	"description" text NOT NULL,
	"quantity_milli" integer NOT NULL,
	"unit_price" bigint NOT NULL,
	"discount" bigint DEFAULT 0 NOT NULL,
	"vat_rate_id" text,
	"vat_bps" integer DEFAULT 0 NOT NULL,
	"sscl_applies" boolean DEFAULT true NOT NULL,
	"net" bigint NOT NULL,
	"sscl" bigint DEFAULT 0 NOT NULL,
	"vat" bigint DEFAULT 0 NOT NULL,
	"total" bigint NOT NULL,
	"invoice_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"kind" text DEFAULT 'invoice' NOT NULL,
	"number" text,
	"customer_id" uuid NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"issue_date" date NOT NULL,
	"supply_date" date,
	"due_date" date NOT NULL,
	"reference" text,
	"notes" text,
	"net" bigint DEFAULT 0 NOT NULL,
	"vat" bigint DEFAULT 0 NOT NULL,
	"sscl" bigint DEFAULT 0 NOT NULL,
	"total" bigint DEFAULT 0 NOT NULL,
	"paid" bigint DEFAULT 0 NOT NULL,
	"credited" bigint DEFAULT 0 NOT NULL,
	"vat_registered" boolean DEFAULT false NOT NULL,
	"credit_for_id" uuid,
	"quote_id" uuid,
	"recurring_id" uuid,
	"snapshot" jsonb,
	"public_token" text NOT NULL,
	"journal_entry_id" uuid,
	"sent_at" timestamp with time zone,
	"reminders_sent" integer DEFAULT 0 NOT NULL,
	"last_reminder_at" timestamp with time zone,
	"voided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_public_token_unique" UNIQUE("public_token"),
	CONSTRAINT "invoices_status" CHECK ("invoices"."status" in ('draft','sent','part_paid','paid','void')),
	CONSTRAINT "invoices_kind" CHECK ("invoices"."kind" in ('invoice','credit_note')),
	CONSTRAINT "invoices_amounts" CHECK ("invoices"."total" >= 0 and "invoices"."paid" >= 0 and "invoices"."credited" >= 0 and "invoices"."paid" + "invoices"."credited" <= "invoices"."total"),
	CONSTRAINT "invoices_numbered" CHECK ("invoices"."status" = 'draft' or "invoices"."number" is not null)
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"unit" text,
	"unit_price" bigint NOT NULL,
	"vat_rate_id" text,
	"sscl" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_price" CHECK ("items"."unit_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"entry_date" date NOT NULL,
	"memo" text NOT NULL,
	"source_type" text NOT NULL,
	"source_id" uuid,
	"reverses_entry_id" uuid,
	"reversed_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"debit" bigint DEFAULT 0 NOT NULL,
	"credit" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "journal_lines_one_side" CHECK ("journal_lines"."debit" >= 0 and "journal_lines"."credit" >= 0 and (("journal_lines"."debit" = 0) <> ("journal_lines"."credit" = 0)))
);
--> statement-breakpoint
CREATE TABLE "locked_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"from_date" date NOT NULL,
	"to_date" date NOT NULL,
	"label" text NOT NULL,
	"reference" text,
	"locked_by" uuid,
	"locked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "locked_periods_range" CHECK ("locked_periods"."from_date" <= "locked_periods"."to_date")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"business_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_business_id_user_id_pk" PRIMARY KEY("business_id","user_id"),
	CONSTRAINT "memberships_role" CHECK ("memberships"."role" in ('owner','accountant','admin'))
);
--> statement-breakpoint
CREATE TABLE "monthly_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"supplier_id" uuid,
	"category_id" text NOT NULL,
	"amount" bigint NOT NULL,
	"vat" bigint DEFAULT 0 NOT NULL,
	"method" text NOT NULL,
	"day_of_month" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_costs_day" CHECK ("monthly_costs"."day_of_month" between 1 and 28),
	CONSTRAINT "monthly_costs_amount" CHECK ("monthly_costs"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"user_id" uuid,
	"title" text NOT NULL,
	"body" text,
	"link" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid,
	"to_email" text NOT NULL,
	"reply_to" text,
	"subject" text NOT NULL,
	"body_text" text NOT NULL,
	"link" text,
	"attach_invoice_id" uuid,
	"attach_quote_id" uuid,
	"status" text DEFAULT 'queued' NOT NULL,
	"error" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_status_valid" CHECK ("outbox_emails"."status" in ('kept','queued','sending','sent','failed'))
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "quote_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"item_id" uuid,
	"description" text NOT NULL,
	"quantity_milli" integer NOT NULL,
	"unit_price" bigint NOT NULL,
	"discount" bigint DEFAULT 0 NOT NULL,
	"vat_rate_id" text,
	"vat_bps" integer DEFAULT 0 NOT NULL,
	"sscl_applies" boolean DEFAULT true NOT NULL,
	"net" bigint NOT NULL,
	"sscl" bigint DEFAULT 0 NOT NULL,
	"vat" bigint DEFAULT 0 NOT NULL,
	"total" bigint NOT NULL,
	"quote_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"number" text,
	"customer_id" uuid NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"issue_date" date NOT NULL,
	"expiry_date" date NOT NULL,
	"notes" text,
	"net" bigint DEFAULT 0 NOT NULL,
	"vat" bigint DEFAULT 0 NOT NULL,
	"sscl" bigint DEFAULT 0 NOT NULL,
	"total" bigint DEFAULT 0 NOT NULL,
	"vat_registered" boolean DEFAULT false NOT NULL,
	"invoice_id" uuid,
	"snapshot" jsonb,
	"sent_at" timestamp with time zone,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_status" CHECK ("quotes"."status" in ('draft','sent','accepted','declined','invoiced'))
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"method" text NOT NULL,
	"received_on" date NOT NULL,
	"reference" text,
	"cheque_number" text,
	"cheque_date" date,
	"cheque_bank" text,
	"journal_entry_id" uuid,
	"voided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "receipts_positive" CHECK ("receipts"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "recurring_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"frequency" text NOT NULL,
	"next_run" date NOT NULL,
	"end_date" date,
	"mode" text DEFAULT 'draft' NOT NULL,
	"template" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recurring_frequency" CHECK ("recurring_invoices"."frequency" in ('weekly','monthly','quarterly','yearly')),
	CONSTRAINT "recurring_mode" CHECK ("recurring_invoices"."mode" in ('draft','send'))
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"email" text,
	"phone" text,
	"address" text,
	"vat_number" text,
	"default_category_id" text,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ask_messages" ADD CONSTRAINT "ask_messages_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ask_messages" ADD CONSTRAINT "ask_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_lines" ADD CONSTRAINT "bill_lines_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_lines" ADD CONSTRAINT "bill_lines_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_entry_id_journal_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locked_periods" ADD CONSTRAINT "locked_periods_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locked_periods" ADD CONSTRAINT "locked_periods_locked_by_users_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_costs" ADD CONSTRAINT "monthly_costs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_costs" ADD CONSTRAINT "monthly_costs_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox_emails" ADD CONSTRAINT "outbox_emails_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox_emails" ADD CONSTRAINT "outbox_emails_attach_invoice_id_invoices_id_fk" FOREIGN KEY ("attach_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox_emails" ADD CONSTRAINT "outbox_emails_attach_quote_id_quotes_id_fk" FOREIGN KEY ("attach_quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_invoices" ADD CONSTRAINT "recurring_invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_business_code" ON "accounts" USING btree ("business_id","code");--> statement-breakpoint
CREATE INDEX "activity_business_created" ON "activity" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "ask_messages_thread" ON "ask_messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "ask_messages_business" ON "ask_messages" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "attachments_owner" ON "attachments" USING btree ("owner_type","owner_id");--> statement-breakpoint
CREATE INDEX "bill_lines_bill" ON "bill_lines" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "bill_payments_bill" ON "bill_payments" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "bills_business_status" ON "bills" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "customers_business" ON "customers" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "expenses_business_date" ON "expenses" USING btree ("business_id","spent_on");--> statement-breakpoint
CREATE INDEX "invoice_lines_invoice" ON "invoice_lines" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_business_number" ON "invoices" USING btree ("business_id","number");--> statement-breakpoint
CREATE INDEX "invoices_business_status" ON "invoices" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "invoices_customer" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "items_business" ON "items" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "journal_entries_business_date" ON "journal_entries" USING btree ("business_id","entry_date");--> statement-breakpoint
CREATE INDEX "journal_entries_source" ON "journal_entries" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "journal_lines_entry" ON "journal_lines" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "journal_lines_account" ON "journal_lines" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "locked_periods_business" ON "locked_periods" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "memberships_user" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "monthly_costs_business" ON "monthly_costs" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "notifications_business" ON "notifications" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "outbox_status" ON "outbox_emails" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quote_lines_quote" ON "quote_lines" USING btree ("quote_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quotes_business_number" ON "quotes" USING btree ("business_id","number");--> statement-breakpoint
CREATE INDEX "quotes_business_status" ON "quotes" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "receipts_business_date" ON "receipts" USING btree ("business_id","received_on");--> statement-breakpoint
CREATE INDEX "receipts_invoice" ON "receipts" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "recurring_business" ON "recurring_invoices" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "sessions_user" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "suppliers_business" ON "suppliers" USING btree ("business_id");