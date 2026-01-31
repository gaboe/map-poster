# Discovery Questions: Zod to Effect Schema Migration

## Current State Summary

**Already migrated to Effect Schema:**

- `packages/common/src/branded-ids.ts` - All branded IDs (UserId, ProjectId, OrganizationId, etc.)
- `packages/common/src/schemas/project.ts` - Project input schemas using branded IDs
- `apps/web-app/src/projects/trpc/project.ts` - `createProject` procedure
- `apps/web-app/src/organizations/components/create-project-dialog.tsx` - Form validation

**Still using Zod:**

- TRPC: `updateProjectName`, `deleteProject` + all other routers
- Frontend: 7 more form components
- Infrastructure: env validation, theme, sort-preferences

**Drizzle DB schema:**

- Uses `$type<>()` for enums (OrganizationRoleValue, UserRoleValue, etc.)
- Does NOT use branded IDs from Effect Schema yet

---

## Q1: Should Drizzle schema use Effect branded ID types via `$type<>()`?

**Default if unknown:** Yes - ensures type safety from DB to API boundary

**Example change:**

```typescript
// Before
id: text("id").primaryKey().$defaultFn(() => createId()),
organizationId: text("organization_id").notNull(),

// After
import { type UserId, type OrganizationId } from "@map-poster/common";
id: text("id").primaryKey().$defaultFn(() => createId()).$type<UserId>(),
organizationId: text("organization_id").notNull().$type<OrganizationId>(),
```

**Impact:** Full type safety - can't accidentally pass ProjectId where OrganizationId expected.

---

## Q2: Should we create shared Effect Schemas in `packages/common/src/schemas/` for all domains?

**Default if unknown:** Yes - follow the pattern from `project.ts`

**New files needed:**

- `organization.ts` - CreateOrganization, UpdateOrganization
- `member.ts` - InviteMember, UpdateMemberRole
- `invitation.ts` - CreateInvitation, AcceptInvitation
- `user.ts` - UpdateProfile, etc.

---

## Q3: For TRPC procedures, use `Schema.standardSchemaV1()` wrapper consistently?

**Default if unknown:** Yes - already working in `createProject`

**Pattern:**

```typescript
.input(Schema.standardSchemaV1(CreateProjectInput))
```

---

## Q4: Should env validation (client.ts, server.ts) migrate to Effect Schema?

**Default if unknown:** No - keep Zod for env validation (simpler, battle-tested)

**Reasoning:** Env validation is a special case - runs at build time, Zod is well-established here.

---

## Q5: Migration order priority?

**Default if unknown:**

1. **First:** Drizzle schema - add branded ID types
2. **Second:** Create shared schemas in `packages/common`
3. **Third:** TRPC routers - use shared schemas
4. **Fourth:** Frontend forms - use same schemas
5. **Optional:** Infrastructure files

**Reasoning:** DB types flow through the entire stack, so start there.
