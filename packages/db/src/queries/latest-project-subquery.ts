/**
 * Type-safe LATERAL join subquery for fetching the latest project per organization.
 *
 * Uses Drizzle's native leftJoinLateral support for full type-safety.
 * If a column is renamed or removed from the schema, TypeScript will catch it.
 *
 * @see https://orm.drizzle.team/docs/joins#left-join-lateral
 */

import { desc, eq } from "drizzle-orm";
import {
  organizationsTable,
  projectsTable,
} from "../schema";
import type { Db } from "../index";

/**
 * Creates a type-safe subquery for fetching the latest project per organization.
 *
 * Uses Drizzle's query builder so all columns are validated at compile time.
 * The subquery can be used with `.leftJoinLateral()` for efficient fetching.
 *
 * @example
 * ```ts
 * const latestProjectSq = createLatestProjectSubquery(db);
 *
 * const result = await db
 *   .select({
 *     orgId: organizationsTable.id,
 *     orgName: organizationsTable.name,
 *     latestProjectId: latestProjectSq.id,
 *     latestProjectName: latestProjectSq.name,
 *     latestProjectCreatedAt: latestProjectSq.createdAt,
 *   })
 *   .from(organizationsTable)
 *   .leftJoinLateral(latestProjectSq, sql`true`);
 * ```
 */
export function createLatestProjectSubquery(db: Db) {
  return db
    .select({
      id: projectsTable.id,
      name: projectsTable.name,
      createdAt: projectsTable.createdAt,
      organizationId: projectsTable.organizationId,
    })
    .from(projectsTable)
    .where(
      eq(
        projectsTable.organizationId,
        organizationsTable.id
      )
    )
    .orderBy(desc(projectsTable.createdAt))
    .limit(1)
    .as("latest_project");
}

/**
 * Type for the latest project subquery result.
 * Use this when you need to type the subquery columns in your select.
 */
export type LatestProjectSubquery = ReturnType<
  typeof createLatestProjectSubquery
>;
