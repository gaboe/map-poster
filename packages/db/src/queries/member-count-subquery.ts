/**
 * Type-safe subquery for counting members per organization.
 *
 * Demonstrates using aggregate functions in subqueries with proper typing.
 *
 * @see https://orm.drizzle.team/docs/select#aggregations
 */

import { count, eq } from "drizzle-orm";
import {
  membersTable,
  organizationsTable,
} from "../schema";
import type { Db } from "../index";

/**
 * Creates a subquery that counts members for each organization.
 *
 * Can be used as a scalar subquery in SELECT or as a lateral join.
 *
 * @example Using as scalar subquery:
 * ```ts
 * const memberCountSq = createMemberCountSubquery(db);
 *
 * const result = await db
 *   .select({
 *     orgId: organizationsTable.id,
 *     orgName: organizationsTable.name,
 *     memberCount: memberCountSq,
 *   })
 *   .from(organizationsTable);
 * ```
 *
 * @example Using with lateral join for additional member stats:
 * ```ts
 * const memberStatsSq = db
 *   .select({
 *     totalMembers: count(),
 *     owners: count().filter(eq(membersTable.role, 'owner')),
 *   })
 *   .from(membersTable)
 *   .where(eq(membersTable.organizationId, organizationsTable.id))
 *   .as('member_stats');
 *
 * const result = await db
 *   .select({
 *     orgId: organizationsTable.id,
 *     totalMembers: memberStatsSq.totalMembers,
 *     owners: memberStatsSq.owners,
 *   })
 *   .from(organizationsTable)
 *   .leftJoinLateral(memberStatsSq, sql`true`);
 * ```
 */
export function createMemberCountSubquery(db: Db) {
  return db
    .select({ count: count() })
    .from(membersTable)
    .where(
      eq(membersTable.organizationId, organizationsTable.id)
    )
    .as("member_count");
}

/**
 * Type for the member count subquery result.
 */
export type MemberCountSubquery = ReturnType<
  typeof createMemberCountSubquery
>;
