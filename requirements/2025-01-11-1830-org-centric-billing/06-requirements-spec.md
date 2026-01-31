# Requirements Specification - Organization-Centric Billing Model

**Generated:** 2025-01-11T18:55:00Z
**Status:** Complete
**Author:** Gabriel

## Executive Summary

Transform the current user-centric billing model to organization-centric billing where organizations (not users) own subscriptions and pay based on seat limits. Each tier has fixed seat limits that cannot be expanded without upgrading tiers.

## Problem Statement

The current system has conflicting billing models:

- Database and API structure suggests organization-centric billing
- Feature matrix and limits suggest user-centric billing
- No enforcement of any limits (organizations or seats)
- Users can create unlimited organizations and add unlimited members

## Solution Overview

Implement true organization-centric billing where:

- Organizations own and pay for subscriptions
- Each tier has fixed seat limits (not expandable)
- Users can belong to multiple organizations
- Each organization is a separate Stripe customer
- Billing is managed at organization level by admins only

## Functional Requirements

### FR1: Organization Subscription Management

**FR1.1** Organizations are the primary billing entity

- Each organization has its own Stripe customer ID
- Subscriptions belong to organizations, not users
- Organizations choose from tiers: Free (1 seat), Start (5 seats), Business (unlimited), Enterprise (custom)

**FR1.2** Stripe customer synchronization

- Create Stripe customer when organization is created
- Update Stripe customer when organization name changes
- Keep user Stripe customers for Better Auth compatibility only

### FR2: Seat Management

**FR2.1** Fixed seat limits per tier

- Free: 1 seat
- Start: 5 seats
- Business: Unlimited seats
- Enterprise: Custom seats

**FR2.2** Hard seat enforcement

- Block member additions when at seat limit
- Show clear error message requiring upgrade
- Count only active members (not pending invitations)

**FR2.3** Invitation handling

- Allow sending invitations beyond seat limit
- Block invitation acceptance if it would exceed limit
- Show seat availability during invitation flow

### FR3: User Organization Management

**FR3.1** Manual organization creation

- Users start with zero organizations after registration
- Must manually create first organization from dashboard
- Can create multiple organizations (each with own billing)

**FR3.2** Multi-tenancy support

- Users can belong to multiple organizations
- Each organization bills independently
- User counts as one seat in each organization

### FR4: UI/UX Requirements

**FR4.1** Seat usage visibility

- Display "X/Y seats used" on members page (`/app/organization/$id/members`)
- Show seat limit warnings when approaching limit
- Display upgrade prompts when at limit

**FR4.2** Billing page updates

- Use organization's Stripe customer ID for all operations
- Show organization-specific billing information
- Customer portal links use organization's customer ID

**FR4.3** Feature matrix updates

- Remove "Organizations: 1/5/Unlimited" row
- Change "Users" to "Seats" or "Team Members"
- Update pricing page copy for organization billing

## Technical Requirements

### TR1: Database Schema (No Changes Needed)

Existing schema already supports org-centric:

- `organizationsTable.tier`
- `organizationsTable.stripeCustomerId`
- `organizationsTable.stripeSubscriptionId`
- `organizationsTable.subscriptionStatus`

### TR2: API Changes

**TR2.1** Organization TRPC Router (`organization.ts`)

- Add Stripe customer creation in `createOrganization`
- Add organization name update handler with Stripe sync
- Remove user-level organization limit checks

**TR2.2** Members TRPC Router (`members.ts`)

- Add seat limit validation before adding members
- Count current members against organization tier
- Return seat usage in member queries

**TR2.3** Invitations TRPC Router (`invitations.ts`)

- Validate seat availability on invitation acceptance
- Add seat limit information to invitation responses
- Block acceptance when at limit

**TR2.4** Billing TRPC Router (`billing.ts`)

- Ensure all operations use organization's Stripe customer ID
- Add organization update webhook handlers
- Maintain referenceId as organizationId

### TR3: Common Package Updates (`@map-poster/common`)

**TR3.1** Update `billing/types.ts`

- Remove `maxOrganizations` from `TierLimits`
- Add `maxSeats` to `TierLimits` type
- Update `TIER_LIMITS` with seat limits
- Update `FEATURE_MATRIX` to show seats not organizations

### TR4: Stripe Integration

**TR4.1** Customer management

- Create Stripe customer on organization creation
- Update customer on organization name change
- Use organization customer ID for all billing operations

**TR4.2** Webhook handling

- Handle organization update events
- Sync organization details with Stripe
- Process subscription changes at org level

## Implementation Checklist

### Phase 1: Core Billing Logic

- [ ] Update `@map-poster/common/billing/types.ts` with seat limits
- [ ] Add Stripe customer creation to organization creation
- [ ] Add organization update handler with Stripe sync
- [ ] Implement seat limit validation in member addition

### Phase 2: Invitation System

- [ ] Add seat validation to invitation acceptance
- [ ] Update invitation UI with seat information
- [ ] Handle edge cases for pending invitations

### Phase 3: UI Updates

- [ ] Add seat usage display to members page
- [ ] Update feature comparison table
- [ ] Update pricing page copy
- [ ] Add upgrade prompts when at limits

### Phase 4: Migration & Testing

- [ ] Handle existing organizations without Stripe customers
- [ ] Test multi-organization scenarios
- [ ] Verify Better Auth compatibility
- [ ] Test seat limit enforcement

## Acceptance Criteria

1. **Organizations own subscriptions**
   - ✓ Each organization has its own Stripe customer
   - ✓ Billing operations use organization's customer ID
   - ✓ Organization name syncs with Stripe

2. **Seat limits enforced**
   - ✓ Cannot add members beyond tier limit
   - ✓ Clear error messages when at limit
   - ✓ Upgrade prompts displayed appropriately

3. **User experience**
   - ✓ Users can belong to multiple organizations
   - ✓ Seat usage clearly visible on members page
   - ✓ No artificial organization creation limits

4. **Backward compatibility**
   - ✓ Better Auth continues to work
   - ✓ Existing organizations migrated properly
   - ✓ No data loss during transition

## Assumptions

1. Existing Stripe products/prices remain unchanged
2. Better Auth user customer creation continues
3. No grandfathering of existing organizations needed
4. Hard seat limits are acceptable (no overage period)
5. Enterprise tier handled separately (custom contracts)

## Out of Scope

1. Seat purchasing/expansion within same tier
2. Usage-based billing
3. Proration for mid-cycle changes
4. Team/department management within organizations
5. Role-based pricing (all members cost the same)
