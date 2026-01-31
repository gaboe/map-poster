# Initial Request: Zod to Effect Schema Migration

**Requested:** 2026-01-05 08:03
**User Request (Slovak):**

> zacali sme prepisovat zod na effect schema - pozri git diff - zatial sme to pouzili len v create-project-dialog.tsx

## Summary

Migration from Zod to Effect Schema for validation across the codebase. The first file has already been migrated:

- `apps/web-app/src/organizations/components/create-project-dialog.tsx`

## Current State (from git diff)

The migration pattern established:

```typescript
// BEFORE (Zod)
import { z } from "zod";
const projectSchema = z.object({
  name: z.string().min(3, "Project name is required"),
});
validators: { onChange: projectSchema }

// AFTER (Effect Schema)
import { Schema } from "effect";
const projectSchema = Schema.Struct({
  name: Schema.String.pipe(
    Schema.minLength(3, {
      message: () => "Project name is required",
    })
  ),
});
validators: {
  onChange: Schema.standardSchemaV1(projectSchema),
}
```

## Files Using Zod (Identified)

### Frontend Forms (Priority for migration)

- `apps/web-app/src/organizations/components/create-organization-dialog.tsx`
- `apps/web-app/src/shared/ui/contact-sales-modal.tsx`
- `apps/web-app/src/shared/contact-form.tsx`
- `apps/web-app/src/routes/app/organization/$id/settings.tsx`
- `apps/web-app/src/routes/app/project/$id/settings.tsx`
- `apps/web-app/src/routes/sign-in.tsx`
- `apps/web-app/src/routes/sign-up.tsx`
- `apps/web-app/src/routes/app/admin/users.tsx`

### TRPC Routers (Need careful consideration - affects API contracts)

- `apps/web-app/src/organizations/trpc/invitations.ts`
- `apps/web-app/src/organizations/trpc/organization.ts`
- `apps/web-app/src/organizations/trpc/members.ts`
- `apps/web-app/src/contact/trpc/router.ts`
- `apps/web-app/src/projects/trpc/project.ts`
- `apps/web-app/src/admin/trpc/admin.ts`
- `apps/web-app/src/admin/trpc/observability.ts`
- `apps/web-app/src/project-permissions/trpc/project-permissions.ts`
- `apps/web-app/src/infrastructure/trpc/procedures/organization.ts`
- `apps/web-app/src/infrastructure/trpc/procedures/project-access.ts`

### Infrastructure/Config

- `apps/web-app/src/env/client.ts`
- `apps/web-app/src/env/server.ts`
- `apps/web-app/src/infrastructure/sort-preferences.ts`
- `apps/web-app/src/infrastructure/theme.ts`
- `apps/web-app/src/auth/oauth-types.ts`

### Packages

- `packages/logger/src/index.ts`
- `packages/common/src/access-rights/models.ts`
