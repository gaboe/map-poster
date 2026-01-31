import type { TRPCRouterRecord } from "@trpc/server";
import { adminProcedure } from "@/infrastructure/trpc/procedures/auth";
import { Schema } from "effect";
import {
  eq,
  and,
  sql,
  or,
  ilike,
  desc,
  asc,
} from "drizzle-orm";
import {
  usersTable,
  organizationsTable,
  membersTable,
  sessionsTable,
} from "@map-poster/db";
import {
  UserId,
  OrganizationId,
  OrganizationRoleSchema,
  Email,
} from "@map-poster/common";
import {
  forbiddenError,
  notFoundError,
} from "@/infrastructure/errors";
import { auth } from "@/auth/auth";
import { logger } from "@map-poster/logger";

export const router = {
  // Get user statistics
  getUserStats: adminProcedure.query(
    async ({ ctx: { db } }) => {
      const twentyFourHoursAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      );

      const [
        totalUsersResult,
        adminUsersResult,
        activeUsersLast24hResult,
        totalOrganizationsResult,
      ] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(usersTable),
        db
          .select({ count: sql<number>`count(*)` })
          .from(usersTable)
          .where(eq(usersTable.role, "admin")),
        db
          .select({
            count: sql<number>`count(DISTINCT ${usersTable.id})`,
          })
          .from(usersTable)
          .leftJoin(
            sessionsTable,
            eq(sessionsTable.userId, usersTable.id)
          )

          .where(
            sql`${sessionsTable.updatedAt} >= ${twentyFourHoursAgo}`
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(organizationsTable),
      ]);

      return {
        totalUsers: Number(totalUsersResult[0]?.count || 0),
        adminUsersCount: Number(
          adminUsersResult[0]?.count || 0
        ),
        activeUsersLast24h: Number(
          activeUsersLast24hResult[0]?.count || 0
        ),
        totalOrganizations: Number(
          totalOrganizationsResult[0]?.count || 0
        ),
      };
    }
  ),

  // Get all users with their roles and organization memberships
  getUsers: adminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          page: Schema.optionalWith(
            Schema.Number.pipe(
              Schema.greaterThanOrEqualTo(1)
            ),
            { default: () => 1 }
          ),
          pageSize: Schema.optionalWith(
            Schema.Number.pipe(
              Schema.greaterThanOrEqualTo(1),
              Schema.lessThanOrEqualTo(100)
            ),
            { default: () => 10 }
          ),
          search: Schema.optional(Schema.String),
          include: Schema.optional(
            Schema.Array(Schema.String)
          ),
          exclude: Schema.optional(
            Schema.Array(Schema.String)
          ),
          sortBy: Schema.optional(
            Schema.Literal(
              "name",
              "email",
              "role",
              "createdAt",
              "lastActiveAt"
            )
          ),
          sortDirection: Schema.optionalWith(
            Schema.Literal("asc", "desc"),
            { default: () => "asc" as const }
          ),
        })
      )
    )
    .query(async ({ ctx: { db }, input }) => {
      const {
        page,
        pageSize,
        search,
        include,
        exclude,
        sortBy,
        sortDirection,
      } = input;
      const offset = (page - 1) * pageSize;

      // Build WHERE clause for search
      const searchCondition = search
        ? or(
            ilike(usersTable.name, `%${search}%`),
            ilike(usersTable.email, `%${search}%`)
          )
        : undefined;

      // Build WHERE clause for include
      const includeCondition =
        include && include.length > 0
          ? or(
              ...include.flatMap((term) => [
                ilike(usersTable.name, `%${term}%`),
                ilike(usersTable.email, `%${term}%`),
              ])
            )
          : undefined;

      // Build WHERE clause for exclude
      const excludeCondition =
        exclude && exclude.length > 0
          ? or(
              ...exclude.flatMap((term) => [
                ilike(usersTable.name, `%${term}%`),
                ilike(usersTable.email, `%${term}%`),
              ])
            )
          : undefined;

      // Combine all conditions
      const conditions = [
        searchCondition,
        includeCondition,
        excludeCondition
          ? sql`NOT (${excludeCondition})`
          : undefined,
      ].filter(Boolean);

      const whereCondition =
        conditions.length > 0
          ? and(...conditions)
          : undefined;

      // Compute lastActiveAt from sessions and auth_sessions
      const usersWithActivity = db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
          role: usersTable.role,
          banned: usersTable.banned,
          createdAt: usersTable.createdAt,
          lastActiveAt: sql<Date>`
            COALESCE(MAX(${sessionsTable.updatedAt}), ${usersTable.createdAt})
          `.as("lastActiveAt"),
        })
        .from(usersTable)
        .leftJoin(
          sessionsTable,
          eq(sessionsTable.userId, usersTable.id)
        )
        .where(whereCondition)
        .groupBy(usersTable.id)
        .as("users_with_activity");

      // Apply sorting
      const orderByClause = sortBy
        ? sortDirection === "desc"
          ? desc(usersWithActivity[sortBy])
          : asc(usersWithActivity[sortBy])
        : asc(usersWithActivity.email); // Default sort by email asc

      // Get paginated results with sorting
      const users = await db
        .select()
        .from(usersWithActivity)
        .orderBy(orderByClause)
        .limit(pageSize)
        .offset(offset);

      // Get total count with same search and exclude filters
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(usersTable)
        .where(whereCondition);

      const total = Number(totalResult[0]?.count || 0);

      return {
        users,
        total,
        page,
        pageSize,
      };
    }),

  // Get user details with organization memberships
  getUserDetail: adminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({ userId: UserId })
      )
    )
    .query(async ({ ctx: { db }, input }) => {
      const { userId } = input;

      // Get user info
      const user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (user.length === 0) {
        throw notFoundError("User not found");
      }

      // Get user's organization memberships
      const memberships = await db
        .select({
          organizationId: membersTable.organizationId,
          role: membersTable.role,
          organization: {
            id: organizationsTable.id,
            name: organizationsTable.name,
            createdAt: organizationsTable.createdAt,
          },
        })
        .from(membersTable)
        .leftJoin(
          organizationsTable,
          eq(
            membersTable.organizationId,
            organizationsTable.id
          )
        )
        .where(eq(membersTable.userId, userId));

      return {
        user: user[0],
        memberships,
      };
    }),

  // Set user as admin
  setUserAdmin: adminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          email: Email,
          isAdmin: Schema.Boolean,
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      // Find user by email (listUsers with filter)
      const users = await auth.api.listUsers({
        headers: ctx.headers,
        query: {
          searchField: "email",
          searchOperator: "contains",
          searchValue: input.email,
          limit: 1,
        },
      });
      const user = users.users[0];
      if (!user) {
        throw notFoundError(
          `User with email ${input.email} not found`
        );
      }
      // Set role
      await auth.api.setRole({
        headers: ctx.headers,
        body: {
          userId: user.id,
          role: input.isAdmin ? "admin" : "user",
        },
      });
      return {
        success: true,
        message: `User ${input.email} ${input.isAdmin ? "promoted to" : "removed from"} admin role`,
      };
    }),

  // Set organization role for user
  setUserOrganizationRole: adminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          userId: UserId,
          organizationId: OrganizationId,
          role: OrganizationRoleSchema,
        })
      )
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const { userId, organizationId, role } = input;

      // Check if membership exists
      const existingMembership = await db
        .select()
        .from(membersTable)
        .where(
          and(
            eq(membersTable.userId, userId),
            eq(membersTable.organizationId, organizationId)
          )
        )
        .limit(1);

      if (existingMembership.length === 0) {
        // Create new membership
        await db.insert(membersTable).values({
          userId,
          organizationId,
          role,
        });
      } else {
        // Update existing membership
        await db
          .update(membersTable)
          .set({ role })
          .where(
            and(
              eq(membersTable.userId, userId),
              eq(
                membersTable.organizationId,
                organizationId
              )
            )
          );
      }

      return {
        success: true,
        message: `User role updated to ${role}`,
      };
    }),

  // Ban/unban user
  banUser: adminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          userId: UserId,
          banned: Schema.Boolean,
          reason: Schema.optional(Schema.String),
          expiresAt: Schema.optional(Schema.Date),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      if (input.banned) {
        // Ban user
        await auth.api.banUser({
          headers: ctx.headers,
          body: {
            userId: input.userId,
            banReason: input.reason,
            banExpiresIn: input.expiresAt
              ? Math.floor(
                  (input.expiresAt.getTime() - Date.now()) /
                    1000
                )
              : undefined,
          },
        });
      } else {
        // Unban user
        await auth.api.unbanUser({
          headers: ctx.headers,
          body: {
            userId: input.userId,
          },
        });
      }
      return {
        success: true,
        message: `User ${input.banned ? "banned" : "unbanned"} successfully`,
      };
    }),

  // Get all organizations with member counts
  getAllOrganizations: adminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          page: Schema.optionalWith(
            Schema.Number.pipe(
              Schema.greaterThanOrEqualTo(1)
            ),
            { default: () => 1 }
          ),
          pageSize: Schema.optionalWith(
            Schema.Number.pipe(
              Schema.greaterThanOrEqualTo(1),
              Schema.lessThanOrEqualTo(100)
            ),
            { default: () => 50 }
          ),
        })
      )
    )
    .query(async ({ ctx: { db }, input }) => {
      const { page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      // Get all organizations with member counts
      const organizations = await db
        .select({
          id: organizationsTable.id,
          name: organizationsTable.name,
          createdAt: organizationsTable.createdAt,
          memberCount: sql<number>`count(${membersTable.id})`,
        })
        .from(organizationsTable)
        .leftJoin(
          membersTable,
          eq(
            membersTable.organizationId,
            organizationsTable.id
          )
        )
        .groupBy(organizationsTable.id)
        .limit(pageSize)
        .offset(offset)
        .orderBy(desc(organizationsTable.createdAt));

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(organizationsTable);

      const total = Number(countResult[0]?.count || 0);

      return {
        organizations,
        total,
        page,
        pageSize,
      };
    }),

  // Permanently delete a user (cascades via FKs). Admin-only.
  deleteUser: adminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({ userId: UserId })
      )
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = input;

      // Prevent deleting your own account via admin panel
      if (userId === ctx.session?.user.id) {
        throw forbiddenError(
          "You cannot delete your own account from admin"
        );
      }

      // Delete user using server-side Better Auth API
      try {
        const result = await auth.api.removeUser({
          headers: ctx.headers,
          body: { userId },
        });

        return { success: true, result };
      } catch (error) {
        logger.error(
          { userId, error },
          "Better Auth removeUser error"
        );
        throw new Error(
          `Failed to delete user: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
} satisfies TRPCRouterRecord;
