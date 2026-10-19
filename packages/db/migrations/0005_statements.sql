CREATE TABLE "bank_statement_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"statement_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"seq" integer NOT NULL,
	"date" date NOT NULL,
	"description" text NOT NULL,
	"amount" bigint NOT NULL,
	"balance" bigint,
	"reference" text,
	"status" text DEFAULT 'unmatched' NOT NULL,
	"matched_table" text,
	"matched_id" uuid,
	"proposal_id" uuid,
	"category_id" text,
	"note" text,
	CONSTRAINT "bank_statement_lines_status" CHECK ("bank_statement_lines"."status" in ('unmatched','matched','proposed','ignored')),
	CONSTRAINT "bank_statement_lines_amount" CHECK ("bank_statement_lines"."amount" <> 0)
);
--> statement-breakpoint
CREATE TABLE "bank_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"attachment_id" uuid NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"format" text NOT NULL,
	"read_by" text,
	"account_label" text,
	"period_from" date,
	"period_to" date,
	"opening_balance" bigint,
	"closing_balance" bigint,
	"line_count" integer DEFAULT 0 NOT NULL,
	"balance_problems" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_statements_status" CHECK ("bank_statements"."status" in ('queued','reading','matching','done','failed'))
);
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "target_id" uuid;--> statement-breakpoint
ALTER TABLE "bank_statement_lines" ADD CONSTRAINT "bank_statement_lines_statement_id_bank_statements_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."bank_statements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statement_lines" ADD CONSTRAINT "bank_statement_lines_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_attachment_id_attachments_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bank_statement_lines_seq" ON "bank_statement_lines" USING btree ("statement_id","seq");--> statement-breakpoint
CREATE INDEX "bank_statement_lines_business_date" ON "bank_statement_lines" USING btree ("business_id","date");--> statement-breakpoint
CREATE INDEX "bank_statements_business" ON "bank_statements" USING btree ("business_id","created_at");