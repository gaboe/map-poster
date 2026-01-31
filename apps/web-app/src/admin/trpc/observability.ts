import type { TRPCRouterRecord } from "@trpc/server";
import { adminProcedure } from "@/infrastructure/trpc/procedures/auth";
import { sql } from "drizzle-orm";
import { Schema } from "effect";

type AnalysisSection = {
  title: string;
  description: string;
  data: Array<Record<string, unknown>>;
  recommendations?: string[];
};

export const router = {
  getDatabaseAnalysis: adminProcedure.query(
    async ({ ctx: { db } }) => {
      // 1. TABLE STATISTICS (Size, Rows, Dead Rows)
      const tableStats = await db.execute(sql`
        SELECT
          schemaname,
          relname as table_name,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size,
          pg_size_pretty(pg_relation_size(schemaname||'.'||relname)) as table_size,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname) - pg_relation_size(schemaname||'.'||relname)) as indexes_size,
          n_live_tup as live_rows,
          n_dead_tup as dead_rows,
          ROUND(100 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_ratio_pct,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC
        LIMIT 20
      `);

      // 2. TABLES WITH HIGH SEQUENTIAL SCANS (Potential Missing Indexes)
      const sequentialScans = await db.execute(sql`
        SELECT
          schemaname,
          relname as table_name,
          seq_scan as sequential_scans,
          seq_tup_read as rows_read_sequentially,
          idx_scan as index_scans,
          CASE
            WHEN seq_scan > 0
            THEN ROUND(100.0 * idx_scan / (seq_scan + idx_scan), 2)
            ELSE 0
          END as index_usage_pct,
          n_live_tup as live_rows
        FROM pg_stat_user_tables
        WHERE n_live_tup > 100
        ORDER BY seq_scan DESC
        LIMIT 15
      `);

      // 3. UNUSED OR RARELY USED INDEXES
      const unusedIndexes = await db.execute(sql`
        SELECT
          schemaname,
          relname as table_name,
          indexrelname as index_name,
          idx_scan as times_used,
          pg_size_pretty(pg_relation_size(schemaname||'.'||indexrelname)) as index_size,
          pg_get_indexdef(indexrelid) as index_definition
        FROM pg_stat_user_indexes
        WHERE idx_scan < 10
          AND schemaname = 'public'
        ORDER BY pg_relation_size(schemaname||'.'||indexrelname) DESC
        LIMIT 15
      `);

      // 4. POTENTIAL DUPLICATE INDEXES
      const duplicateIndexes = await db.execute(sql`
        SELECT
          a.indrelid::regclass as table_name,
          a.indexrelid::regclass as index1,
          b.indexrelid::regclass as index2,
          pg_get_indexdef(a.indexrelid) as index1_def,
          pg_get_indexdef(b.indexrelid) as index2_def
        FROM pg_index a
        JOIN pg_index b ON a.indrelid = b.indrelid
        WHERE a.indexrelid > b.indexrelid
          AND a.indkey::text = b.indkey::text
          AND a.indrelid::regclass::text LIKE '%public%'
      `);

      // 5. FOREIGN KEY COLUMNS WITHOUT INDEXES
      const foreignKeysWithoutIndexes =
        await db.execute(sql`
        SELECT
          c.conrelid::regclass as table_name,
          c.conname as constraint_name,
          a.attname as column_name,
          'CREATE INDEX idx_' || c.conrelid::regclass || '_' || a.attname ||
          ' ON ' || c.conrelid::regclass || '(' || a.attname || ');' as suggested_index
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
        WHERE c.contype = 'f'
          AND NOT EXISTS (
            SELECT 1 FROM pg_index i
            WHERE i.indrelid = c.conrelid
              AND a.attnum = ANY(i.indkey)
              AND i.indkey[0] = a.attnum
          )
        ORDER BY c.conrelid::regclass
      `);

      // 6. BLOATED TABLES (High Dead Tuple Ratio)
      const bloatedTables = await db.execute(sql`
        SELECT
          schemaname,
          relname as table_name,
          n_live_tup as live_rows,
          n_dead_tup as dead_rows,
          ROUND(100 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_ratio_pct,
          last_vacuum,
          last_autovacuum
        FROM pg_stat_user_tables
        WHERE n_dead_tup > 100
          AND ROUND(100 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) > 10
        ORDER BY dead_ratio_pct DESC
        LIMIT 15
      `);

      // 7. BUFFER CACHE HIT RATIO (Should be > 99%)
      const cacheHitRatio = await db.execute(sql`
        SELECT
          ROUND(100.0 * sum(blks_hit) / NULLIF(sum(blks_hit + blks_read), 0), 2) as cache_hit_ratio_pct
        FROM pg_stat_database
        WHERE datname = current_database()
      `);

      // 8. INDEX USAGE RATIO BY TABLE
      const indexUsageRatio = await db.execute(sql`
        SELECT
          schemaname,
          relname as table_name,
          ROUND(100.0 * idx_scan / NULLIF(seq_scan + idx_scan, 0), 2) as index_usage_pct,
          idx_scan as index_scans,
          seq_scan as sequential_scans,
          n_live_tup as live_rows
        FROM pg_stat_user_tables
        WHERE n_live_tup > 100
        ORDER BY index_usage_pct ASC NULLS FIRST
        LIMIT 15
      `);

      const sections: AnalysisSection[] = [
        {
          title: "Table Statistics",
          description:
            "Database tables ordered by total size, including row counts and bloat metrics",
          data: tableStats.rows,
          ...(tableStats.rows.some(
            (row) =>
              (row as { dead_ratio_pct: number })
                .dead_ratio_pct > 10
          ) && {
            recommendations: [
              "Tables with >10% dead rows should be VACUUMed",
            ],
          }),
        },
        {
          title: "High Sequential Scans",
          description:
            "Tables with many sequential scans may benefit from additional indexes",
          data: sequentialScans.rows,
          ...(sequentialScans.rows.some(
            (row) =>
              (row as { index_usage_pct: number })
                .index_usage_pct < 50
          ) && {
            recommendations: [
              "Tables with <50% index usage may need new indexes",
              "Review WHERE clauses in queries to identify missing indexes",
            ],
          }),
        },
        {
          title: "Unused/Rarely Used Indexes",
          description:
            "Indexes used less than 10 times - consider removing to improve write performance",
          data: unusedIndexes.rows,
          ...(unusedIndexes.rows.length > 0 && {
            recommendations: [
              "Unused indexes waste space and slow down writes",
              "Verify indexes are not needed before dropping",
            ],
          }),
        },
        {
          title: "Duplicate Indexes",
          description:
            "Indexes with identical column definitions - remove duplicates",
          data: duplicateIndexes.rows,
          ...(duplicateIndexes.rows.length > 0 && {
            recommendations: [
              "Drop duplicate indexes to save space",
            ],
          }),
        },
        {
          title: "Foreign Keys Without Indexes",
          description:
            "Foreign key columns lacking indexes - slows down JOINs and cascading deletes",
          data: foreignKeysWithoutIndexes.rows,
          ...(foreignKeysWithoutIndexes.rows.length > 0 && {
            recommendations: [
              "Add indexes to foreign key columns for better JOIN performance",
              "Use suggested index DDL from the report",
            ],
          }),
        },
        {
          title: "Bloated Tables",
          description:
            "Tables with >10% dead rows - need VACUUM",
          data: bloatedTables.rows,
          ...(bloatedTables.rows.length > 0 && {
            recommendations: [
              "Run VACUUM on bloated tables",
              "Consider VACUUM FULL for severe bloat (requires table lock)",
            ],
          }),
        },
        {
          title: "Cache Hit Ratio",
          description:
            "PostgreSQL buffer cache efficiency - should be >99%",
          data: cacheHitRatio.rows,
          ...(cacheHitRatio.rows.length > 0 &&
            (
              cacheHitRatio.rows[0] as {
                cache_hit_ratio_pct: number;
              }
            ).cache_hit_ratio_pct < 99 && {
              recommendations: [
                "Cache hit ratio <99% indicates insufficient shared_buffers",
                "Consider increasing shared_buffers in PostgreSQL config",
              ],
            }),
        },
        {
          title: "Index Usage Ratio",
          description:
            "Tables ordered by index usage percentage - low values indicate missing indexes",
          data: indexUsageRatio.rows,
          ...(indexUsageRatio.rows.some((row) => {
            const typedRow = row as {
              index_usage_pct: number | null;
            };
            return (
              typedRow.index_usage_pct === null ||
              typedRow.index_usage_pct < 50
            );
          }) && {
            recommendations: [
              "Tables with low index usage need new indexes",
              "Analyze query patterns to identify optimal indexes",
            ],
          }),
        },
      ];

      return { sections };
    }
  ),

  // Run VACUUM on specific tables
  vacuumTables: adminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          tables: Schema.Array(
            Schema.String.pipe(
              Schema.pattern(/^[a-z_]+$/, {
                message: () =>
                  "Table name can only contain lowercase letters and underscores",
              })
            )
          ).pipe(
            Schema.minItems(1, {
              message: () =>
                "At least one table must be specified",
            })
          ),
        })
      )
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const results = [];

      for (const tableName of input.tables) {
        // Table name validation is handled by schema (only lowercase + underscore)
        try {
          await db.execute(
            sql.raw(`VACUUM ANALYZE ${tableName}`)
          );
          results.push({
            table: tableName,
            success: true,
          });
        } catch (error) {
          results.push({
            table: tableName,
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Unknown error",
          });
        }
      }

      return { results };
    }),
} satisfies TRPCRouterRecord;
