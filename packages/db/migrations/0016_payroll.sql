CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"job" text,
	"started_on" date,
	"ended_on" date,
	"id_number" text,
	"epf_number" text,
	"tax_code" text,
	"basic" bigint DEFAULT 0 NOT NULL,
	"allowances" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pension" boolean DEFAULT false NOT NULL,
	"bank_details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pay_run_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"name" text NOT NULL,
	"job" text,
	"basic" bigint DEFAULT 0 NOT NULL,
	"allowances" bigint DEFAULT 0 NOT NULL,
	"overtime" bigint DEFAULT 0 NOT NULL,
	"gross" bigint NOT NULL,
	"epf_base" bigint DEFAULT 0 NOT NULL,
	"epf_ee" bigint DEFAULT 0 NOT NULL,
	"epf_er" bigint DEFAULT 0 NOT NULL,
	"etf" bigint DEFAULT 0 NOT NULL,
	"apit" bigint DEFAULT 0 NOT NULL,
	"paye" bigint DEFAULT 0 NOT NULL,
	"ee_ni" bigint DEFAULT 0 NOT NULL,
	"er_ni" bigint DEFAULT 0 NOT NULL,
	"pension_ee" bigint DEFAULT 0 NOT NULL,
	"pension_er" bigint DEFAULT 0 NOT NULL,
	"net" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pay_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"month" text NOT NULL,
	"pay_date" date NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"gross" bigint DEFAULT 0 NOT NULL,
	"net" bigint DEFAULT 0 NOT NULL,
	"employer" bigint DEFAULT 0 NOT NULL,
	"entry_id" uuid,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pay_runs_status" CHECK ("pay_runs"."status" in ('draft','approved'))
);
--> statement-breakpoint
CREATE TABLE "payroll_dues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"label" text NOT NULL,
	"pay_to" text NOT NULL,
	"amount" bigint NOT NULL,
	"due_on" date NOT NULL,
	"paid_on" date,
	"method" text,
	"reference" text,
	"entry_id" uuid,
	CONSTRAINT "payroll_dues_kind" CHECK ("payroll_dues"."kind" in ('net','apit','epf','etf','hmrc','pension'))
);
--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pay_run_lines" ADD CONSTRAINT "pay_run_lines_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pay_run_lines" ADD CONSTRAINT "pay_run_lines_run_id_pay_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."pay_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pay_run_lines" ADD CONSTRAINT "pay_run_lines_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pay_runs" ADD CONSTRAINT "pay_runs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pay_runs" ADD CONSTRAINT "pay_runs_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_dues" ADD CONSTRAINT "payroll_dues_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_dues" ADD CONSTRAINT "payroll_dues_run_id_pay_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."pay_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employees_business" ON "employees" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "pay_run_lines_run" ON "pay_run_lines" USING btree ("run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pay_runs_business_month" ON "pay_runs" USING btree ("business_id","month");--> statement-breakpoint
CREATE INDEX "payroll_dues_business" ON "payroll_dues" USING btree ("business_id","due_on");--> statement-breakpoint
-- Every existing business gets the payroll liability accounts new ones are seeded with.
INSERT INTO "accounts" ("business_id", "code", "name", "type", "role")
SELECT b."id", v."code", v."name", 'liability', v."role"
FROM "businesses" b
CROSS JOIN (VALUES
  ('2300', 'Net pay owed to staff', 'payroll_net'),
  ('2310', 'Payroll tax owed', 'payroll_tax'),
  ('2320', 'Pension and fund contributions owed', 'payroll_contributions')
) AS v("code", "name", "role")
WHERE NOT EXISTS (SELECT 1 FROM "accounts" a WHERE a."business_id" = b."id" AND a."code" = v."code");
