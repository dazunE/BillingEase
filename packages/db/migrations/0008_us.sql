ALTER TABLE "businesses" DROP CONSTRAINT "businesses_country";--> statement-breakpoint
ALTER TABLE "businesses" DROP CONSTRAINT "businesses_currency";--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_country" CHECK ("businesses"."country" in ('uk','lk','us'));--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_currency" CHECK (("businesses"."country" = 'uk' and "businesses"."currency" = 'GBP') or ("businesses"."country" = 'lk' and "businesses"."currency" = 'LKR') or ("businesses"."country" = 'us' and "businesses"."currency" = 'USD'));