# Discovery Questions - Organization-Centric Billing Model

**Generated:** 2025-01-11T18:30:00Z  
**Phase:** Discovery

Based on the current codebase analysis, I found:

## Current State Analysis

- **Current Model:** Mixed signals - Organizations have `tier`, `stripeCustomerId`, `stripeSubscriptionId` fields (org-centric) but features like "Organizations: 1/5/Unlimited" suggest user-centric limits
- **Database:** Organizations table has billing fields, but FEATURE_MATRIX shows user-centric limits (max organizations per user)
- **TRPC API:** All billing operations use `organizationId` as `referenceId` (already org-centric)
- **Auth Integration:** Uses Better Auth with `referenceId` pointing to organization

## Discovery Questions

### Q1: Should the new model charge per active member in each organization?

**Default if unknown:** Yes (standard B2B SaaS model like Slack, Linear, Notion)

**Context:** Currently the system shows "Users: 1/5/Unlimited" which suggests per-seat pricing. In org-centric model, organizations typically pay based on number of active team members.

### Q2: Should users be able to belong to multiple organizations with separate billing?

**Default if unknown:** Yes (each organization pays independently)

**Context:** Current database structure already supports this via `membersTable`. Each organization would have its own subscription and billing.

### Q3: Should we remove user-level organization limits (like "max 5 organizations")?

**Default if unknown:** Yes (doesn't make sense in org-centric model)

**Context:** In org-centric billing, there's no reason to limit how many organizations a user can join - each organization pays for itself.

### Q4: Should organization owners/admins be the only ones who can manage billing?

**Default if unknown:** Yes (standard practice for B2B billing)

**Context:** Currently using `protectedOrganizationAdminProcedure` for billing operations, which is correct for org-centric model.

### Q5: Should we keep the current tier system (Free, Start, Business, Enterprise) but make it organization-based?

**Default if unknown:** Yes (maintains existing Stripe setup and pricing structure)

**Context:** The current tier system and Stripe integration can be adapted - organizations choose their tier instead of users choosing based on organization limits.
