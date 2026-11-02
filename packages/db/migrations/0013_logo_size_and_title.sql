ALTER TABLE "businesses" ADD COLUMN "logo_size" integer DEFAULT 48 NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "title_style" text DEFAULT 'tax' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_logo_size" CHECK ("businesses"."logo_size" between 24 and 96);--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_title_style" CHECK ("businesses"."title_style" in ('tax','plain'));