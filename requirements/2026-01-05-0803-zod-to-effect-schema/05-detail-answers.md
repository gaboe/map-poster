# Detail Answers: Zod to Effect Schema Migration

## Q1: Should `access-rights/models.ts` migrate to Effect Schema?

**Answer:** YES

Migrate roles/permissions to Effect Schema for consistency:

```typescript
import { Schema } from "effect";
export const OrganizationRoles = Schema.Literal("owner", "admin", "member");
export const ProjectRoles = Schema.Literal("admin", "editor", "viewer");
```

---

## Q2: For forms needing subset of fields, use `Schema.pick()` or separate schemas?

**Answer:** Use `Schema.pick()` - DRY principle

```typescript
import { CreateProjectInput } from "@map-poster/common";

// Pick only the fields needed for the form
const FormSchema = CreateProjectInput.pipe(Schema.pick("name"));
```

---

## Q3: One big PR or multiple smaller PRs?

**Answer:** One PR

All migration work will be done in a single PR:

- Reorganize `packages/common` structure
- Update Drizzle schema with branded types
- Migrate all TRPC routers
- Migrate all frontend forms

---

## Q4: Should branded IDs have runtime format validation?

**Answer:** NO - just type brands

Keep it simple - branded IDs are only for compile-time type safety, no runtime validation:

```typescript
export const ProjectId = Schema.String.pipe(Schema.brand("ProjectId"));
```

---

## Q5: Where should auth schemas live?

**Answer:** Separate `auth/` domain

Auth schemas (SignInInput, SignUpInput) will have their own domain folder:

```
common/src/
├── auth/
│   ├── ids.ts        # AuthSessionId, ClientSessionId
│   └── schemas.ts    # SignInInput, SignUpInput
├── users/
│   ├── ids.ts        # UserId
│   └── schemas.ts    # UpdateProfileInput
```
