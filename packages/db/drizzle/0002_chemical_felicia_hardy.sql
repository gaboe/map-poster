ALTER TABLE "invitations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "organizations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "project_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "projects" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscriptions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "invitations" CASCADE;--> statement-breakpoint
DROP TABLE "members" CASCADE;--> statement-breakpoint
DROP TABLE "organizations" CASCADE;--> statement-breakpoint
DROP TABLE "project_members" CASCADE;--> statement-breakpoint
DROP TABLE "projects" CASCADE;--> statement-breakpoint
DROP TABLE "subscriptions" CASCADE;--> statement-breakpoint
DROP INDEX "sessions_active_org_idx";--> statement-breakpoint
DROP INDEX "users_stripe_customer_idx";--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN "active_organization_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "stripe_customer_id";