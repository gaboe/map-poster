# Detail Questions - Organization-Centric Billing Implementation

**Generated:** 2025-01-11T18:45:00Z  
**Phase:** Detail

Based on the codebase analysis, these are the critical implementation questions:

## Q6: Should existing users automatically get a personal "free tier" organization created for them?

**Default if unknown:** Yes (smooth migration path)

**Context:** Currently users can exist without organizations. In org-centric model, users need at least one organization to use the platform. We could auto-create a personal organization with their name during migration.

## Q7: Should we prevent organization creation entirely and only allow it through a separate onboarding flow?

**Default if unknown:** No (keep current flow, just add first-org creation)

**Context:** In pure org-centric model, users don't "create" organizations - they either start one during signup or get invited. Currently `createOrganization` exists in `organization.ts:215`. Should we keep it for first organization only?

## Q8: Should seat limits be "hard stops" that prevent adding members, or "soft limits" that allow overage with billing warnings?

**Default if unknown:** Yes (hard stops - based on your earlier answer about hard limits)

**Context:** When an organization reaches its seat limit (e.g., 5/5 seats used), should the system completely block new member additions until they upgrade, or allow it with warnings/grace period?

## Q9: Should pending invitations count against the seat limit?

**Default if unknown:** No (only active members count)

**Context:** If an organization has 4/5 seats used and sends 3 invitations, should those pending invitations be blocked or only count when accepted? This affects the invitation validation logic in `invitations.ts`.

## Q10: Should we show seat usage prominently in the organization header/navigation?

**Default if unknown:** Yes (important metric for admins)

**Context:** Currently no seat usage indicators exist. Should we add "4/5 seats used" in the organization sidebar (`organization-sidebar-section.tsx`) or header to make limits visible?
