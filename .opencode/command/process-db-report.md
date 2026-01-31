---
description: Analyze database performance report and create optimization plan
---

# Process Database Performance Report

## Input

$ARGUMENTS

## Instructions:

1. **Parse Report**: Extract data from the pasted observability report
2. **Analyze Issues**: Identify critical performance problems:
   - Tables with >10% dead rows in "Table Statistics" section (VACUUM needed)
   - "Bloated Tables" section may be empty if tables are small (check "Table Statistics" instead)
   - High sequential scans with low index usage
   - Unused/rarely used indexes (candidates for removal)
   - Duplicate indexes (waste space)
   - Foreign keys without indexes (slow JOINs)
   - Cache hit ratio <99% (insufficient shared_buffers)
3. **Priority Ranking**: Sort issues by impact (high/medium/low)
4. **Generate Action Plan**: Create specific tasks:
   - Index additions in `packages/db/src/schema.ts`
   - VACUUM commands for bloated tables
   - Index removals for unused indexes
   - Configuration changes for cache issues

## Report Format Expected:

```
Table Statistics:
| table_name | total_size | dead_rows | dead_ratio_pct |
|------------|------------|-----------|----------------|
| users      | 2048 MB    | 15000     | 12.5           |

High Sequential Scans:
| table_name | sequential_scans | index_usage_pct |
|------------|------------------|-----------------|
| sessions   | 45000            | 25              |

Unused/Rarely Used Indexes:
| index_name           | times_used | index_size |
|---------------------|------------|------------|
| idx_old_feature     | 2          | 5 MB       |

Foreign Keys Without Indexes:
| table_name | column_name | suggested_index |
|------------|-------------|-----------------|
| posts      | user_id     | CREATE INDEX... |

Cache Hit Ratio:
| cache_hit_ratio_pct |
|---------------------|
| 97.5                |
```

## Output Format:

````markdown
# Database Performance Analysis

## Critical Issues (Immediate Action Required)

### 1. Bloated Tables (Dead Rows >10%)

- **users** (12.5% dead rows, 2048 MB)
  - Action: Run VACUUM via /app/admin/observability UI
  - Impact: Reclaim ~256 MB disk space, improve query speed

### 2. Missing Indexes (Index Usage <50%)

- **sessions** table (25% index usage, 45k sequential scans)
  - Action: Add composite index in schema.ts
  - Code:
    ```typescript
    export const sessionsTable = pgTable(
      "sessions",
      {
        /* fields */
      },
      (table) => [
        index("idx_sessions_lookup").on(
          table.userId,
          table.expiresAt
        ),
      ]
    );
    ```

## Medium Priority (Plan for Next Sprint)

### 3. Unused Indexes (Remove ONLY if Safe)

**WARNING**: Most "unused" indexes are critical constraints:

- Primary keys (`*_pkey`)
- Unique constraints (`*_unique`)
- Business logic constraints (e.g., `organizations_slug_unique`)

**NEVER remove these!** Only consider removal for:

- Non-unique indexes with <10 uses
- Redundant indexes (covered by composite indexes)

Example of SAFE removal:

```typescript
// oauth_consents has composite unique(userId, clientId)
// So single-column index on clientId alone is redundant
index("oauth_consents_client_id_idx"); // SAFE TO REMOVE
```

- **idx_old_feature** (2 uses, 5 MB) - verify not a PK/UNIQUE first
  - Action: Remove from schema.ts, generate migration
  - Impact: Faster INSERT/UPDATE on affected table

## Low Priority (Monitor)

### 4. Cache Hit Ratio (97.5%)

- Slightly below optimal (target: >99%)
- Action: Consider increasing `shared_buffers` in PostgreSQL config
- Impact: Minor performance improvement

## Workflow

1. Add indexes to `packages/db/src/schema.ts`
2. Generate migration: `bun run db:generate`
3. Review migration SQL in `packages/db/drizzle/`
4. Apply: `bun run db:migrate`
5. Run VACUUM on bloated tables via /app/admin/observability UI
6. Monitor Sentry for query performance improvements
7. Re-run report after 24-48h to verify impact
````

## Important Rules:

- Reference actual file paths (`packages/db/src/schema.ts`)
- Provide exact code snippets for schema changes
- Prioritize by impact (dead rows > missing indexes > unused indexes)
- NEVER suggest ad-hoc SQL - schema.ts is source of truth
- Include workflow steps at the end
- Estimate disk space/performance improvements

## Example Usage:

User pastes report from clipboard:

```
Table Statistics:
...
```

Claude responds with prioritized action plan and code snippets.
