# Discovery Answers - Organization-Centric Billing Model

**Recorded:** 2025-01-11T18:35:00Z  
**Phase:** Discovery Complete

## Answers Summary

### Q1: Should the new model charge per active member in each organization?

**Answer:** Yes - with hard seat limits that cannot be expanded by purchasing additional seats
**Implication:** Each tier has a fixed number of seats. Organizations must upgrade to a higher tier to get more seats.

### Q2: Should users be able to belong to multiple organizations with separate billing?

**Answer:** Yes
**Implication:** Each organization has its own subscription. A user counts as a seat in each organization they belong to.

### Q3: Should we remove user-level organization limits (like "max 5 organizations")?

**Answer:** Yes
**Implication:** Users can join unlimited organizations. No artificial limits on user participation.

### Q4: Should organization owners/admins be the only ones who can manage billing?

**Answer:** Yes
**Implication:** Continue using `protectedOrganizationAdminProcedure` for billing operations.

### Q5: Should we keep the current tier system (Free, Start, Business, Enterprise) but make it organization-based?

**Answer:** Yes
**Implication:** Maintain existing Stripe products/prices, but apply them to organizations instead of users.

## Key Decisions Made

1. **Billing Model:** Organization-centric with fixed seat limits per tier
2. **Seat Management:** Hard limits, no seat purchasing
3. **Multi-tenancy:** Full support for users in multiple organizations
4. **Access Control:** Admin-only billing management
5. **Tier Structure:** Keep existing 4-tier system
