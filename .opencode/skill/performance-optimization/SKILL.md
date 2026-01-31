---
name: performance-optimization
description: "LOAD THIS SKILL when: optimizing SQL queries, fixing N+1 problems, user mentions 'slow query', 'performance', 'optimize', 'batch', 'parallel'. Covers N+1 fixes, batch operations, parallel execution, query consolidation, API optimization."
license: MIT
allowed-tools:
  - Bash
  - Read
  - Edit
  - Grep
  - Glob
metadata:
  category: optimization
  stack: effect, drizzle, trpc
---

# Performance Optimization Skill

Use this skill when analyzing and implementing performance optimizations for API calls, database queries, and data processing patterns.

## When to Use

- Analyzing codebase for performance bottlenecks
- Implementing batch operations
- Optimizing N+1 query patterns
- Parallelizing independent operations
- Adding database indexes

## Requirements Tracking

Active optimization requirements are tracked in:
- `requirements/2026-01-17-1645-api-optimization/01-requirements-spec.md`
- `requirements/2026-01-17-1645-api-optimization/metadata.json`

## Analysis Workflow

### 1. Identify Bottlenecks

Search for these patterns:

```typescript
// N+1 Pattern - Loop with API/DB calls
for (const item of items) {
  const data = await db.select().from(table).where(eq(table.id, item.id));
}

// Sequential Independent Calls
const a = await fetchA();
const b = await fetchB();  // Could be parallel

// Individual Inserts/Updates in Loop
for (const item of items) {
  await db.insert(table).values(item);
}
```

### 2. Apply Optimizations

#### Batch Database Queries
```typescript
// Before: N queries
for (const id of ids) {
  const item = await db.select().from(table).where(eq(table.id, id));
}

// After: 1 query
const items = await db.select().from(table).where(inArray(table.id, ids));
const itemMap = new Map(items.map(i => [i.id, i]));
```

#### Parallel Effect Operations
```typescript
// Before: Sequential
const a = yield* effectA();
const b = yield* effectB();

// After: Parallel
const [a, b] = yield* Effect.all([effectA(), effectB()]);

// With concurrency limit
const results = yield* Effect.all(
  items.map(item => processItem(item)),
  { concurrency: 10 }
);
```

#### Parallel Promise Operations
```typescript
// Before: Sequential
await octokit.issues.createComment({...});
await octokit.issues.update({...});

// After: Parallel
await Promise.all([
  octokit.issues.createComment({...}),
  octokit.issues.update({...}),
]);
```

#### Batch Updates
```typescript
// Before: N updates
for (const id of ids) {
  await db.update(table).set({ status: "closed" }).where(eq(table.id, id));
}

// After: 1 update
await db.update(table)
  .set({ status: "closed" })
  .where(inArray(table.id, ids));
```

#### Query Consolidation with JOINs
```typescript
// Before: 2 queries
const membership = await db.select().from(membersTable).where(...);
const org = await db.select().from(organizationsTable).where(...);

// After: 1 query with JOIN
const [result] = await db
  .select({ org: organizationsTable, member: membersTable })
  .from(organizationsTable)
  .innerJoin(membersTable, eq(membersTable.organizationId, organizationsTable.id))
  .where(and(
    eq(organizationsTable.id, orgId),
    eq(membersTable.userId, userId)
  ));
```

## Common Patterns in Vivus Codebase

### Effect.all for Parallel Operations
```typescript
// Parallel with unbounded concurrency (for few items)
yield* Effect.all(items.map(processItem));

// Parallel with bounded concurrency (for many items)
yield* Effect.all(items.map(processItem), { concurrency: 10 });

// Parallel independent fetches
const [pods, metrics] = yield* Effect.all([
  listAllPods(httpClient, credentials),
  listAllPodMetrics(httpClient, credentials),
]);
```

### Pre-fetching with Lookup Maps
```typescript
// Fetch all needed data upfront
const [users, members, invitations] = await Promise.all([
  db.select().from(usersTable).where(inArray(usersTable.email, emails)),
  db.select().from(membersTable).where(inArray(membersTable.userId, userIds)),
  db.select().from(invitationsTable).where(inArray(invitationsTable.email, emails)),
]);

// Build lookup maps
const userByEmail = new Map(users.map(u => [u.email, u]));
const memberByUserId = new Map(members.map(m => [m.userId, m]));

// Use in loop without DB calls
for (const email of emails) {
  const user = userByEmail.get(email);
  // ...
}
```

### Cluster-wide K8s API Calls
```typescript
// Instead of per-namespace calls
for (const ns of namespaces) {
  const pods = yield* listPods(httpClient, credentials, ns);
}

// Use cluster-wide call + local grouping
const allPods = yield* listAllPods(httpClient, credentials);
const podsByNamespace = groupBy(allPods.items, pod => pod.metadata.namespace);
```

## Database Index Guidelines

### When to Add Indexes

1. **Single-column queries**: If filtering by one column frequently
2. **Composite queries**: If filtering by multiple columns together
3. **ORDER BY columns**: If sorting by a column frequently
4. **Foreign keys**: Usually auto-indexed, but verify

### Index Syntax (Drizzle)
```typescript
export const myTable = pgTable(
  "my_table",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("idx_my_table_user_id").on(table.userId),
    index("idx_my_table_status").on(table.status),
    // Composite index for common query pattern
    index("idx_my_table_user_status_created").on(
      table.userId,
      table.status,
      table.createdAt
    ),
  ]
);
```

## Validation Checklist

After implementing optimizations:

- [ ] `bun run check` passes
- [ ] Tests updated if behavior changed
- [ ] Error handling preserved
- [ ] Logging maintained (summary vs per-item as appropriate)
- [ ] Concurrency limits added for external APIs
- [ ] Memory usage considered for large batch operations

## Measuring Impact

Before optimizing, measure:
```typescript
const start = performance.now();
// ... operation
console.log(`Operation took ${performance.now() - start}ms`);
```

Or use Effect tracing:
```typescript
yield* myOperation.pipe(Effect.withSpan("MyOperation"));
```

## References

- See `references/effect-parallel-patterns.md` for Effect-specific patterns
- See `references/drizzle-batch-patterns.md` for Drizzle ORM patterns
