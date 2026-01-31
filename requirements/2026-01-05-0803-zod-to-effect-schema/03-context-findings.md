# Context Findings: Zod to Effect Schema Migration

## Codebase Analysis

### Files Requiring Migration

#### TRPC Routers (10 files)

| File                                               | Zod Usages  | Schemas Needed                                                                                                                          |
| -------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `organizations/trpc/invitations.ts`                | 7 inputs    | SendInvitationsInput, ListInvitationsInput, AcceptInvitationInput, DeclineInvitationInput, CancelInvitationInput, ResendInvitationInput |
| `organizations/trpc/organization.ts`               | 5 inputs    | GetOrganizationInput, CreateOrganizationInput, UpdateOrganizationInput, DeleteOrganizationInput                                         |
| `organizations/trpc/members.ts`                    | ~3 inputs   | UpdateMemberRoleInput, RemoveMemberInput                                                                                                |
| `projects/trpc/project.ts`                         | 2 remaining | UpdateProjectInput, DeleteProjectInput (CreateProjectInput already migrated)                                                            |
| `contact/trpc/router.ts`                           | 1 input     | ContactFormInput                                                                                                                        |
| `admin/trpc/admin.ts`                              | ~3 inputs   | Admin-specific schemas                                                                                                                  |
| `admin/trpc/observability.ts`                      | ~2 inputs   | Observability schemas                                                                                                                   |
| `project-permissions/trpc/project-permissions.ts`  | ~3 inputs   | ProjectPermission schemas                                                                                                               |
| `infrastructure/trpc/procedures/organization.ts`   | 1 input     | OrganizationId input                                                                                                                    |
| `infrastructure/trpc/procedures/project-access.ts` | 1 input     | ProjectId input                                                                                                                         |

#### Frontend Forms (7 files)

| File                                                      | Current Schema | Shared Schema to Use    |
| --------------------------------------------------------- | -------------- | ----------------------- |
| `organizations/components/create-organization-dialog.tsx` | Local Zod      | CreateOrganizationInput |
| `shared/ui/contact-sales-modal.tsx`                       | Local Zod      | ContactSalesInput       |
| `shared/contact-form.tsx`                                 | Local Zod      | ContactFormInput        |
| `routes/app/organization/$id/settings.tsx`                | Local Zod      | UpdateOrganizationInput |
| `routes/app/project/$id/settings.tsx`                     | Local Zod      | UpdateProjectInput      |
| `routes/sign-in.tsx`                                      | Local Zod      | SignInInput             |
| `routes/sign-up.tsx`                                      | Local Zod      | SignUpInput             |

#### Already Migrated (2 files)

- `organizations/components/create-project-dialog.tsx` - ✅ Uses Effect Schema (local definition)
- `projects/trpc/project.ts` - ✅ `createProject` uses `CreateProjectInput` from common

### Current packages/common Structure

```
packages/common/src/
├── access-rights/
│   └── models.ts          # Uses Zod (OrganizationRoles, ProjectRoles)
├── schemas/
│   ├── index.ts
│   └── project.ts         # ✅ Effect Schema (CreateProjectInput, etc.)
├── branded-ids.ts         # ✅ Effect Schema (UserId, ProjectId, etc.)
├── type-coercion.ts
├── types.ts
├── utils/
└── index.ts
```

### Proposed New Structure

```
packages/common/src/
├── projects/
│   ├── ids.ts             # ProjectId branded type
│   └── schemas.ts         # CreateProjectInput, UpdateProjectInput, DeleteProjectInput
├── organizations/
│   ├── ids.ts             # OrganizationId branded type
│   └── schemas.ts         # CreateOrganizationInput, UpdateOrganizationInput, etc.
├── members/
│   ├── ids.ts             # MemberId branded type
│   └── schemas.ts         # UpdateMemberRoleInput, RemoveMemberInput
├── invitations/
│   ├── ids.ts             # InvitationId branded type
│   └── schemas.ts         # SendInvitationsInput, AcceptInvitationInput, etc.
├── users/
│   ├── ids.ts             # UserId, AuthSessionId, ClientSessionId
│   └── schemas.ts         # SignInInput, SignUpInput, UpdateProfileInput
├── contact/
│   └── schemas.ts         # ContactFormInput, ContactSalesInput
├── admin/
│   └── schemas.ts         # Admin-specific schemas
├── access-rights/
│   └── models.ts          # Migrate to Effect Schema (roles, permissions)
└── index.ts               # Re-export all
```

### Patterns Found

#### TRPC Input Pattern (Current - Zod)

```typescript
.input(z.object({
  organizationId: z.string(),
  name: z.string().min(3),
}))
```

#### TRPC Input Pattern (Target - Effect Schema)

```typescript
import { UpdateOrganizationInput } from "@map-poster/common";

.input(Schema.standardSchemaV1(UpdateOrganizationInput))
```

#### Form Validation Pattern (Current - Zod)

```typescript
const schema = z.object({
  name: z.string().min(3, "Name is required"),
});
validators: { onChange: schema }
```

#### Form Validation Pattern (Target - Effect Schema)

```typescript
import { CreateOrganizationInput } from "@map-poster/common";

validators: {
  onChange: Schema.standardSchemaV1(CreateOrganizationInput),
}
```

### Drizzle Schema Changes Needed

In `packages/db/src/schema.ts`, add branded types:

```typescript
import {
  type UserId,
  type OrganizationId,
  type ProjectId,
  type MemberId,
  type InvitationId
} from "@map-poster/common";

// Example changes:
export const usersTable = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()).$type<UserId>(),
  // ...
});

export const projectsTable = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => createId()).$type<ProjectId>(),
  organizationId: text("organization_id").notNull().$type<OrganizationId>(),
  // ...
});
```

### Migration Statistics

| Category       | Total | Migrated  | Remaining |
| -------------- | ----- | --------- | --------- |
| Branded IDs    | 10    | 10        | 0         |
| Shared Schemas | ~25   | 5         | ~20       |
| TRPC Routers   | 10    | 1 partial | 9.5       |
| Frontend Forms | 8     | 1         | 7         |
| Drizzle Tables | 10    | 0         | 10        |
