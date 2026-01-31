# Discovery Answers: Zod to Effect Schema Migration

## Q1: Should Drizzle schema use Effect branded ID types via `$type<>()`?

**Answer:** YES

Drizzle schema will use branded ID types from `@map-poster/common`:

```typescript
import { type UserId, type OrganizationId, type ProjectId } from "@map-poster/common";

id: text("id").primaryKey().$type<UserId>(),
organizationId: text("organization_id").$type<OrganizationId>(),
```

---

## Q2: Should we create shared Effect Schemas organized by domain?

**Answer:** YES - with domain-based folder structure

New structure in `packages/common/src/`:

```
common/src/
├── projects/
│   ├── schemas.ts    # CreateProjectInput, UpdateProjectInput
│   └── ids.ts        # ProjectId
├── organizations/
│   ├── schemas.ts
│   └── ids.ts        # OrganizationId
├── members/
│   ├── schemas.ts
│   └── ids.ts        # MemberId
├── invitations/
│   ├── schemas.ts
│   └── ids.ts        # InvitationId
├── users/
│   ├── schemas.ts
│   └── ids.ts        # UserId
└── index.ts
```

---

## Q3: For TRPC procedures, use `Schema.standardSchemaV1()` wrapper consistently?

**Answer:** YES

Consistent pattern for all TRPC inputs:

```typescript
import { CreateProjectInput } from "@map-poster/common";

.input(Schema.standardSchemaV1(CreateProjectInput))
```

---

## Q4: Should env validation migrate to Effect Schema?

**Answer:** NO - keep Zod

**Reason:** `@t3-oss/env-core` is a Zod-specific library. Migration would require:

- Custom `createEnv()` wrapper
- Risk of breaking build/startup validation
- No practical benefit

Files staying on Zod:

- `apps/web-app/src/env/server.ts`
- `apps/web-app/src/env/client.ts`

---

## Q5: Migration priority order?

**Answer:** All 4 areas are equally important (order is flexible)

**Migration scope:**

1. ✅ Reorganize `packages/common` - domain folders (ids.ts, schemas.ts)
2. ✅ Drizzle schema - add branded ID types
3. ✅ TRPC routers - use shared schemas
4. ✅ Frontend forms - use same schemas

**Excluded (staying on Zod):**

- `apps/web-app/src/env/server.ts`
- `apps/web-app/src/env/client.ts`
