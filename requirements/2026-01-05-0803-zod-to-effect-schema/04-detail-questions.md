# Detail Questions: Zod to Effect Schema Migration

## Q1: Should `access-rights/models.ts` (OrganizationRoles, ProjectRoles) also migrate to Effect Schema?

**Default if unknown:** Yes - for consistency, use Effect Schema enums

**Current code:**

```typescript
// packages/common/src/access-rights/models.ts
import { z } from "zod";
export const OrganizationRoles = z.enum(["owner", "admin", "member"]);
```

**Would become:**

```typescript
import { Schema } from "effect";
export const OrganizationRoles = Schema.Literal("owner", "admin", "member");
```

---

## Q2: For forms that only need a subset of fields, should we use `Schema.pick()` or create separate schemas?

**Default if unknown:** Use `Schema.pick()` - DRY principle

**Example:** `create-project-dialog.tsx` only needs `name`, but `CreateProjectInput` has `name` + `organizationId`

**Option A - pick:**

```typescript
const FormSchema = CreateProjectInput.pipe(Schema.pick("name"));
```

**Option B - separate schema:**

```typescript
// In common
export const ProjectNameInput = Schema.Struct({ name: ProjectName });
```

---

## Q3: Should we migrate in one big PR or split into multiple smaller PRs?

**Default if unknown:** Split into multiple PRs for easier review

**Suggested split:**

1. PR1: Reorganize `packages/common` structure (ids + schemas by domain)
2. PR2: Update Drizzle schema with branded types
3. PR3: Migrate TRPC routers
4. PR4: Migrate frontend forms

---

## Q4: Should branded IDs have validation (e.g., CUID2 format check) or just be type brands?

**Default if unknown:** Just type brands (no runtime validation of format)

**Option A - just brand:**

```typescript
export const ProjectId = Schema.String.pipe(Schema.brand("ProjectId"));
```

**Option B - with format validation:**

```typescript
export const ProjectId = Schema.String.pipe(
  Schema.pattern(/^[a-z0-9]{24,}$/, { message: () => "Invalid ID format" }),
  Schema.brand("ProjectId")
);
```

---

## Q5: For the auth schemas (SignIn, SignUp), should they live in `users/` domain or separate `auth/` domain?

**Default if unknown:** `users/` domain - auth is user-related

**Option A:** `users/schemas.ts` contains SignInInput, SignUpInput
**Option B:** `auth/schemas.ts` as separate domain
