CREATE TABLE "api_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"token_id" uuid,
	"client_id" text,
	"surface" text NOT NULL,
	"operation" text NOT NULL,
	"status" integer NOT NULL,
	"ms" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hash" text NOT NULL,
	"kind" text NOT NULL,
	"prefix" text NOT NULL,
	"name" text NOT NULL,
	"user_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"client_id" text,
	"scopes" jsonb NOT NULL,
	"resource" text,
	"grant_id" uuid,
	"used_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_tokens_kind" CHECK ("api_tokens"."kind" in ('personal','access','refresh'))
);
--> statement-breakpoint
CREATE TABLE "api_usage_daily" (
	"business_id" uuid NOT NULL,
	"day" date NOT NULL,
	"calls" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "api_usage_daily_business_id_day_pk" PRIMARY KEY("business_id","day")
);
--> statement-breakpoint
CREATE TABLE "oauth_clients" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"uri" text,
	"logo_uri" text,
	"redirect_uris" jsonb NOT NULL,
	"fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_clients_kind" CHECK ("oauth_clients"."kind" in ('registered','metadata_url'))
);
--> statement-breakpoint
CREATE TABLE "oauth_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"scopes" jsonb NOT NULL,
	"redirect_uri" text NOT NULL,
	"code_challenge" text NOT NULL,
	"resource" text,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "source_name" text;--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN "api_token_id" uuid;--> statement-breakpoint
ALTER TABLE "api_calls" ADD CONSTRAINT "api_calls_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_calls" ADD CONSTRAINT "api_calls_token_id_api_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."api_tokens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_client_id_oauth_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_usage_daily" ADD CONSTRAINT "api_usage_daily_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_codes" ADD CONSTRAINT "oauth_codes_client_id_oauth_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_codes" ADD CONSTRAINT "oauth_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_codes" ADD CONSTRAINT "oauth_codes_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_calls_business" ON "api_calls" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "api_calls_token" ON "api_calls" USING btree ("token_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "api_tokens_hash" ON "api_tokens" USING btree ("hash");--> statement-breakpoint
CREATE INDEX "api_tokens_business" ON "api_tokens" USING btree ("business_id","created_at");--> statement-breakpoint
CREATE INDEX "api_tokens_grant" ON "api_tokens" USING btree ("grant_id");--> statement-breakpoint
-- Who proposed it never changes: an app's name and token are part of the record.
CREATE OR REPLACE FUNCTION be_proposal_source_fixed() RETURNS trigger AS $$
BEGIN
  IF NEW.source_name IS DISTINCT FROM OLD.source_name OR NEW.api_token_id IS DISTINCT FROM OLD.api_token_id
     OR NEW.proposed_by_kind <> OLD.proposed_by_kind THEN
    RAISE EXCEPTION 'Who made a proposal never changes';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER proposals_source_fixed BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION be_proposal_source_fixed();
