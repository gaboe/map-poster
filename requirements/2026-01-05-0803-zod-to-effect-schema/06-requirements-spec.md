# Requirements Specification: Zod to Effect Schema Migration

Generated: 2026-01-05
Status: Complete

## Overview

Migrate validation from Zod to Effect Schema across the codebase for consistency with the Effect ecosystem. This includes reorganizing `packages/common` with domain-based structure, adding branded ID types to Drizzle schema, and migrating all TRPC routers and frontend forms.

## Functional Requirements

### User Stories

- As a developer, I want type-safe branded IDs so that I can't accidentally pass a ProjectId where OrganizationId is expected
- As a developer, I want shared validation schemas so that frontend and backend use identical validation rules
- As a developer, I want domain-organized code so that related schemas are easy to find and maintain

### Acceptance Criteria

- [x] All branded IDs use Effect Schema in `packages/common/{domain}/ids.ts`
- [x] All input schemas use Effect Schema in `packages/common/{domain}/schemas.ts`
- [x] Drizzle schema uses branded types via `$type<>()`
- [x] All TRPC routers use `Schema.standardSchemaV1()` for inputs
- [x] All frontend forms use Effect Schema validation
- [x] `bun run check` passes with no errors
- [x] Env validation files (`env/server.ts`, `env/client.ts`) remain on Zod

## Technical Requirements

### 1. Reorganize packages/common Structure

**New folder structure:**

```
packages/common/src/
├── projects/
│   ├── ids.ts              # ProjectId
│   └── schemas.ts          # CreateProjectInput, UpdateProjectInput, DeleteProjectInput
├── organizations/
│   ├── ids.ts              # OrganizationId
│   └── schemas.ts          # CreateOrganizationInput, UpdateOrganizationInput
├── members/
│   ├── ids.ts              # MemberId
│   └── schemas.ts          # UpdateMemberRoleInput, RemoveMemberInput
├── invitations/
│   ├── ids.ts              # InvitationId
│   └── schemas.ts          # SendInvitationsInput, AcceptInvitationInput, etc.
├── users/
│   ├── ids.ts              # UserId
│   └── schemas.ts          # UpdateProfileInput
├── auth/
│   ├── ids.ts              # AuthSessionId, ClientSessionId
│   └── schemas.ts          # SignInInput, SignUpInput
├── contact/
│   └── schemas.ts          # ContactFormInput, ContactSalesInput
├── admin/
│   └── schemas.ts          # Admin-specific schemas
├── access-rights/
│   └── models.ts           # OrganizationRoles, ProjectRoles (migrate to Effect)
└── index.ts                # Re-export all domains
```

**Files to delete after migration:**

- `packages/common/src/branded-ids.ts` (move to domain folders)
- `packages/common/src/schemas/` (move to domain folders)

### 2. Branded ID Pattern

```typescript
// packages/common/src/projects/ids.ts
import { Schema } from "effect";

export const ProjectId = Schema.String.pipe(Schema.brand("ProjectId"));
export type ProjectId = typeof ProjectId.Type;
```

### 3. Input Schema Pattern

```typescript
// packages/common/src/projects/schemas.ts
import { Schema } from "effect";
import { OrganizationId, ProjectId } from "./ids";

export const CreateProjectInput = Schema.Struct({
  organizationId: OrganizationId,
  name: Schema.String.pipe(
    Schema.minLength(1, { message: () => "Project name is required" }),
    Schema.maxLength(100, { message: () => "Project name must be less than 100 characters" })
  ),
});
export type CreateProjectInput = typeof CreateProjectInput.Type;

export const UpdateProjectInput = Schema.Struct({
  projectId: ProjectId,
  name: Schema.optional(
    Schema.String.pipe(
      Schema.minLength(1, { message: () => "Project name is required" }),
      Schema.maxLength(100, { message: () => "Project name must be less than 100 characters" })
    )
  ),
});
export type UpdateProjectInput = typeof UpdateProjectInput.Type;
```

### 4. Access Rights Migration

```typescript
// packages/common/src/access-rights/models.ts
import { Schema } from "effect";

export const OrganizationRoles = Schema.Literal("owner", "admin", "member");
export type OrganizationRole = typeof OrganizationRoles.Type;

export const ProjectRoles = Schema.Literal("admin", "editor", "viewer");
export type ProjectRole = typeof ProjectRoles.Type;
```

### 5. Drizzle Schema Updates

**File:** `packages/db/src/schema.ts`

```typescript
import {
  type UserId,
  type OrganizationId,
  type ProjectId,
  type MemberId,
  type InvitationId,
  type AuthSessionId,
} from "@map-poster/common";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()).$type<UserId>(),
  // ...
});

export const organizationsTable = pgTable("organizations", {
  id: text("id").primaryKey().$defaultFn(() => createId()).$type<OrganizationId>(),
  // ...
});

export const projectsTable = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => createId()).$type<ProjectId>(),
  organizationId: text("organization_id").notNull().$type<OrganizationId>(),
  // ...
});

export const membersTable = pgTable("members", {
  id: text("id").primaryKey().$defaultFn(() => createId()).$type<MemberId>(),
  userId: text("user_id").notNull().$type<UserId>(),
  organizationId: text("organization_id").notNull().$type<OrganizationId>(),
  // ...
});

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => createId()).$type<AuthSessionId>(),
  userId: text("user_id").notNull().$type<UserId>(),
  // ...
});
```

### 6. TRPC Router Pattern

**File:** `apps/web-app/src/projects/trpc/project.ts`

```typescript
import { Schema } from "effect";
import {
  CreateProjectInput,
  UpdateProjectInput,
  DeleteProjectInput
} from "@map-poster/common";

export const router = {
  createProject: protectedProcedure
    .input(Schema.standardSchemaV1(CreateProjectInput))
    .mutation(async ({ ctx, input }) => {
      // input is typed as CreateProjectInput
    }),

  updateProject: protectedProjectAdminProcedure
    .input(Schema.standardSchemaV1(UpdateProjectInput))
    .mutation(async ({ ctx, input }) => {
      // input is typed as UpdateProjectInput
    }),
} satisfies TRPCRouterRecord;
```

### 7. Frontend Form Pattern

**File:** `apps/web-app/src/organizations/components/create-project-dialog.tsx`

```typescript
import { Schema } from "effect";
import { CreateProjectInput } from "@map-poster/common";

// Pick only fields needed for the form
const FormSchema = CreateProjectInput.pipe(Schema.pick("name"));

const form = useAppForm({
  defaultValues: { name: "" },
  validators: {
    onChange: Schema.standardSchemaV1(FormSchema),
  },
  onSubmit: async ({ value }) => {
    await createProject.mutateAsync({
      name: value.name,
      organizationId,
    });
  },
});
```

## Files to Modify

### packages/common (create new structure)

| Action | Path                                         |
| ------ | -------------------------------------------- |
| Create | `src/projects/ids.ts`                        |
| Create | `src/projects/schemas.ts`                    |
| Create | `src/organizations/ids.ts`                   |
| Create | `src/organizations/schemas.ts`               |
| Create | `src/members/ids.ts`                         |
| Create | `src/members/schemas.ts`                     |
| Create | `src/invitations/ids.ts`                     |
| Create | `src/invitations/schemas.ts`                 |
| Create | `src/users/ids.ts`                           |
| Create | `src/users/schemas.ts`                       |
| Create | `src/auth/ids.ts`                            |
| Create | `src/auth/schemas.ts`                        |
| Create | `src/contact/schemas.ts`                     |
| Create | `src/admin/schemas.ts`                       |
| Modify | `src/access-rights/models.ts` (Zod → Effect) |
| Modify | `src/index.ts` (update exports)              |
| Delete | `src/branded-ids.ts`                         |
| Delete | `src/schemas/` folder                        |

### packages/db

| Action | Path                                |
| ------ | ----------------------------------- |
| Modify | `src/schema.ts` (add branded types) |

### apps/web-app TRPC Routers

| Action | Path                                                   |
| ------ | ------------------------------------------------------ |
| Modify | `src/organizations/trpc/invitations.ts`                |
| Modify | `src/organizations/trpc/organization.ts`               |
| Modify | `src/organizations/trpc/members.ts`                    |
| Modify | `src/projects/trpc/project.ts`                         |
| Modify | `src/contact/trpc/router.ts`                           |
| Modify | `src/admin/trpc/admin.ts`                              |
| Modify | `src/admin/trpc/observability.ts`                      |
| Modify | `src/project-permissions/trpc/project-permissions.ts`  |
| Modify | `src/infrastructure/trpc/procedures/organization.ts`   |
| Modify | `src/infrastructure/trpc/procedures/project-access.ts` |

### apps/web-app Frontend Forms

| Action | Path                                                          |
| ------ | ------------------------------------------------------------- |
| Modify | `src/organizations/components/create-project-dialog.tsx`      |
| Modify | `src/organizations/components/create-organization-dialog.tsx` |
| Modify | `src/shared/ui/contact-sales-modal.tsx`                       |
| Modify | `src/shared/contact-form.tsx`                                 |
| Modify | `src/routes/app/organization/$id/settings.tsx`                |
| Modify | `src/routes/app/project/$id/settings.tsx`                     |
| Modify | `src/routes/sign-in.tsx`                                      |
| Modify | `src/routes/sign-up.tsx`                                      |

### Files NOT to Modify (staying on Zod)

| Path                | Reason                        |
| ------------------- | ----------------------------- |
| `src/env/server.ts` | @t3-oss/env-core requires Zod |
| `src/env/client.ts` | @t3-oss/env-core requires Zod |

## Implementation Notes

### Key Patterns

1. **Branded IDs**: Simple type brands without runtime format validation
2. **Shared Schemas**: Same schema used by TRPC input and frontend form validation
3. **Schema.pick()**: Use for forms that need subset of fields
4. **Schema.standardSchemaV1()**: Required wrapper for TRPC and TanStack Form compatibility

### Testing

After migration:

1. Run `bun run check` - must pass
2. Run `bun run test` - all tests must pass
3. Run `bun run test:e2e` - E2E tests must pass
4. Manual testing of all forms and TRPC endpoints

### Rollback Plan

If issues found:

- Revert PR
- All changes are in single PR for atomic rollback

## Summary

| Category                | Planned | Completed |
| ----------------------- | ------- | --------- |
| New domain folders      | 8       | 8         |
| Schemas created         | ~25     | 25+       |
| TRPC routers migrated   | 10      | 10        |
| Frontend forms migrated | 8       | 8         |
| Drizzle tables updated  | ~10     | 10        |
| Files staying on Zod    | 2       | 2         |

## Implementation Notes (Post-Completion)

### Auth Middleware Optimization

Instead of casting `session.user.id as UserId` in every TRPC router, a centralized cast was added to the `enforceUserIsAuthenticated` middleware in `apps/web-app/src/infrastructure/trpc/procedures/auth.ts`:

```typescript
const enforceUserIsAuthenticated = t.middleware(
  ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw UNAUTHORIZED;
    }

    return next({
      ctx: {
        session: {
          ...ctx.session,
          user: {
            ...ctx.session.user,
            id: ctx.session.user.id as UserId,  // Centralized cast
          },
        },
      },
    });
  }
);
```

This ensures all `protectedProcedure` and derived procedures have `session.user.id` typed as `UserId` automatically.

### Frontend Form Patterns

Frontend forms use two patterns:

1. **Shared schemas** from `@map-poster/common` (e.g., `SignInInput`, `SignUpInput`)
2. **Local schemas** for form-specific validation that differs from API input (e.g., `OrgSettingsFormSchema`)

Both patterns use `Schema.standardSchemaV1()` for TanStack Form compatibility.
