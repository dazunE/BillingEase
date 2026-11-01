ALTER TABLE "businesses" ADD COLUMN "template" text DEFAULT 'classic' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "font" text DEFAULT 'sans' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "footer" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "logo_key" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "logo_mime" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_template" CHECK ("businesses"."template" in ('classic','modern','minimal'));--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_font" CHECK ("businesses"."font" in ('sans','serif','mono'));