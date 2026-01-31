# Context Findings - Organization-Centric Billing Analysis

**Generated:** 2025-01-11T18:40:00Z  
**Phase:** Context Analysis

## Current Implementation State

### ✅ What's Already Correct

1. **Database Schema**
   - Organizations table has billing fields (tier, stripeCustomerId, stripeSubscriptionId)
   - Subscription table uses `referenceId` pointing to organizations
   - Members table properly links users to organizations

2. **TRPC Billing Routes**
   - All billing operations use `organizationId` as reference
   - Protected with `protectedOrganizationAdminProcedure`
   - Stripe integration already organization-focused

3. **UI Components**
   - Organization billing page exists
   - Billing cards are organization-scoped
   - Feature comparison table ready for org tiers

### ❌ What's Missing/Wrong

1. **No Enforcement Logic**
   - Organization creation has NO tier validation
   - Member addition has NO seat limit checks
   - No way to determine user's effective tier

2. **User-Centric Feature Matrix**
   - Shows "Organizations: 1/5/Unlimited" (wrong model)
   - Shows "Users: 1/5/Unlimited" (needs to be seats per org)
   - `TIER_LIMITS.maxOrganizations` shouldn't exist

3. **Missing Seat Management**
   - No seat counting in member addition
   - No seat limit validation in invitations
   - No UI indicators for seat usage

## Files Requiring Changes

### High Priority - Core Logic Changes

1. **`packages/common/src/billing/types.ts`**
   - Remove `maxOrganizations` from `TIER_LIMITS`
   - Update `FEATURE_MATRIX` to show seats not users
   - Add `maxSeats` to `TierLimits` type

2. **`apps/web-app/src/organizations/trpc/organization.ts`**
   - Remove organization creation (users don't create orgs in org-centric)
   - Or limit to first org creation only

3. **`apps/web-app/src/organizations/trpc/members.ts`**
   - Add seat limit validation before adding members
   - Count current members against org tier

4. **`apps/web-app/src/invitations/trpc/invitations.ts`**
   - Validate seat availability before sending invites
   - Show seat limit in invitation flow

### Medium Priority - UI Updates

5. **`apps/web-app/src/shared/ui/feature-comparison-table.tsx`**
   - Update feature rows for org-centric model
   - Show seat limits instead of org limits

6. **`apps/web-app/src/routes/pricing.tsx`**
   - Update pricing page copy for org-centric
   - Explain seat-based pricing

7. **`apps/web-app/src/routes/app/organization/$id/billing.tsx`**
   - Add seat usage indicator (X/Y seats used)
   - Show upgrade prompt when at limit

### Low Priority - Cleanup

8. **`apps/web-app/src/shared/pricing-table.tsx`**
   - Generic pricing table (not used in production)
   - Can be deleted or updated

## Implementation Patterns Found

### Current Procedures Pattern

```typescript
// Organization-scoped operations
protectedOrganizationAdminProcedure; // Admin only
protectedOrganizationMemberProcedure; // Any member
```

### Seat Validation Pattern (To Implement)

```typescript
// Check seat availability
const memberCount = await db
  .select({ count: count() })
  .from(membersTable)
  .where(eq(membersTable.organizationId, orgId));

const seatLimit = TIER_LIMITS[organization.tier].maxSeats;
if (memberCount >= seatLimit) {
  throw forbiddenError("Seat limit reached");
}
```

### Organization Tier Access Pattern

```typescript
// Get organization with tier
const org = await db
  .select()
  .from(organizationsTable)
  .where(eq(organizationsTable.id, orgId))
  .limit(1);

const tier = org[0]?.tier || "free";
```

## Related Features Analyzed

1. **Better Auth Integration**
   - Stripe plugin configured for org billing
   - Uses `referenceId` for organization mapping
   - Supports subscription management

2. **Invitation System**
   - Already organization-scoped
   - Needs seat limit validation added

3. **Project Creation**
   - Has project limits per tier
   - Already enforces limits correctly

## Technical Constraints

1. **Stripe Products**
   - Already created with lookup keys
   - Can reuse existing products
   - Just change what limits apply to

2. **Database Migration**
   - No schema changes needed
   - Only logic changes required

3. **Backward Compatibility**
   - Need to handle existing users
   - Default them to free tier orgs
