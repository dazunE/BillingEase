CREATE TABLE "practice_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"user_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"created_by" uuid,
	"title" text NOT NULL,
	"body" text,
	"link" text,
	"status" text DEFAULT 'open' NOT NULL,
	"done_at" timestamp with time zone,
	"done_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "practice_requests_status" CHECK ("practice_requests"."status" in ('open','done'))
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"share_pct" integer DEFAULT 100 NOT NULL,
	"monthly_rent" bigint DEFAULT 0 NOT NULL,
	"rent_day" integer,
	"agent" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "properties_share" CHECK ("properties"."share_pct" between 1 and 100)
);
--> statement-breakpoint
CREATE TABLE "property_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"on_date" date NOT NULL,
	"description" text NOT NULL,
	"payee" text,
	"category_id" text,
	"amount" bigint NOT NULL,
	"share" bigint NOT NULL,
	"method" text NOT NULL,
	"entry_id" uuid,
	"voided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "property_entries_kind" CHECK ("property_entries"."kind" in ('rent','cost'))
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"on_date" date NOT NULL,
	"from_place" text NOT NULL,
	"to_place" text NOT NULL,
	"purpose" text,
	"miles" integer NOT NULL,
	"vehicle" text DEFAULT 'car' NOT NULL,
	"amount" bigint NOT NULL,
	"entry_id" uuid,
	"voided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trips_vehicle" CHECK ("trips"."vehicle" in ('car','motorcycle','bicycle')),
	CONSTRAINT "trips_miles" CHECK ("trips"."miles" > 0)
);
--> statement-breakpoint
ALTER TABLE "practice_messages" ADD CONSTRAINT "practice_messages_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_messages" ADD CONSTRAINT "practice_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_requests" ADD CONSTRAINT "practice_requests_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_requests" ADD CONSTRAINT "practice_requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_requests" ADD CONSTRAINT "practice_requests_done_by_users_id_fk" FOREIGN KEY ("done_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_entries" ADD CONSTRAINT "property_entries_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_entries" ADD CONSTRAINT "property_entries_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "practice_messages_business" ON "practice_messages" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "practice_requests_business" ON "practice_requests" USING btree ("business_id","status");--> statement-breakpoint
CREATE INDEX "properties_business" ON "properties" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "property_entries_property" ON "property_entries" USING btree ("property_id","on_date");--> statement-breakpoint
CREATE INDEX "trips_business_date" ON "trips" USING btree ("business_id","on_date");