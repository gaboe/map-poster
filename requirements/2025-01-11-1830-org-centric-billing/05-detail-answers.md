# Detail Answers - Organization-Centric Implementation Details

**Recorded:** 2025-01-11T18:50:00Z  
**Phase:** Detail Complete

## Implementation Requirements from User

### Critical Stripe Integration Requirements

1. **Organization as Stripe Customer**
   - Create new Stripe customers for organizations (not users)
   - Handle Stripe webhook updates when organization name changes via UI
   - Add update logic to TRPC when organization details change

2. **Stripe Customer ID Handling**
   - All billing links must use organization's `stripeCustomerId`
   - NOT the user's `stripeCustomerId`
   - Keep creating user customers in Better Auth for compatibility

3. **Better Auth Compatibility**
   - Continue creating Stripe customers per user in Better Auth
   - Maintains order with Better Auth system
   - Organizations have separate Stripe customers

## Detail Questions Answered

### Q6: Should existing users automatically get a personal "free tier" organization created?

**Answer:** No - users must create organizations manually after registration
**Implication:** Users start with no organizations and must explicitly create one

### Q7: Should we prevent organization creation entirely?

**Answer:** No - users can still create organizations from dashboard
**Implication:** Keep `createOrganization` endpoint functional on user dashboard

### Q8: Should seat limits be "hard stops"?

**Answer:** Yes
**Implication:** Block member additions when at limit with clear error message

### Q9: Should pending invitations count against seat limit?

**Answer:** No
**Implication:** Only active members count; invitations can exceed but acceptance is blocked if over limit

### Q10: Should we show seat usage prominently?

**Answer:** Yes - specifically in `/app/organization/$id/members.tsx`
**Implication:** Add seat usage indicator (e.g., "4/5 seats used") to members page

## Key Implementation Points

1. **Stripe Customer Management**
   - Organizations are primary Stripe customers
   - Update Stripe when org details change
   - Sync organization name with Stripe

2. **User Flow**
   - Registration → No automatic org
   - User must create first org manually
   - Can create multiple orgs from dashboard

3. **Seat Management**
   - Hard limits enforced
   - Pending invites don't count
   - Clear usage display on members page

4. **Billing References**
   - All subscription operations use org's Stripe ID
   - Portal links use org's customer ID
   - Keep user Stripe IDs for Better Auth only
