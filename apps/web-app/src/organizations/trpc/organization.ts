import type { TRPCRouterRecord } from "@trpc/server";
import { protectedProcedure } from "@/infrastructure/trpc/procedures/auth";
import {
  protectedOrganizationAdminProcedure,
  protectedOrganizationMemberProcedure,
} from "@/infrastructure/trpc/procedures/organization";
import { eq, and, isNull, sql } from "drizzle-orm";
import {
  organizationsTable,
  membersTable,
  projectsTable,
  usersTable,
  invitationsTable,
  projectMembersTable,
} from "@map-poster/db";
import {
  createLatestProjectSubquery,
  createMemberCountSubquery,
} from "@map-poster/db/queries";
import { Schema } from "effect";
import {
  forbiddenError,
  notFoundError,
} from "@/infrastructure/errors";
import {
  InvitationStatus,
  OrganizationId,
} from "@map-poster/common";

export const router = {
  getUserOrganizations: protectedProcedure.query(
    async ({ ctx: { session, db } }) => {
      const userId = session.user.id;
      // Get organizations where user is a member (Better Auth style)
      const userMemberships =
        await db.query.membersTable.findMany({
          where: eq(membersTable.userId, userId),
          with: {
            organization: true,
          },
        });
      return userMemberships.map((m) => m.organization);
    }
  ),

  getOrganizationsDetails: protectedProcedure.query(
    async ({ ctx: { session, db } }) => {
      const userId = session.user.id;
      const userEmail = session.user.email;

      // Optimized query using PostgreSQL json_agg for aggregation
      // Hide organizations where the user still has a pending invitation to accept
      const result = await db
        .select({
          // Organization data
          orgId: organizationsTable.id,
          orgName: organizationsTable.name,
          orgSlug: organizationsTable.slug,
          orgLogo: organizationsTable.logo,
          orgMetadata: organizationsTable.metadata,
          orgCreatedAt: organizationsTable.createdAt,

          // User's role in this organization
          userRole: membersTable.role,

          // Aggregate projects as JSON array (only for privileged members or project members)
          projects: sql<
            Array<{
              id: string;
              name: string;
              createdAt: Date;
            }>
          >`
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'id', ${projectsTable.id},
                  'name', ${projectsTable.name},
                  'createdAt', ${projectsTable.createdAt}
                )
              ) FILTER (
                WHERE ${projectsTable.id} IS NOT NULL
                AND (
                  ${membersTable.role} IN ('owner', 'admin')
                  OR ${projectMembersTable.role} IS NOT NULL
                )
              ),
              '[]'
            )
          `,
        })
        .from(membersTable)
        .innerJoin(
          organizationsTable,
          eq(
            membersTable.organizationId,
            organizationsTable.id
          )
        )
        .leftJoin(
          projectsTable,
          eq(
            projectsTable.organizationId,
            organizationsTable.id
          )
        )
        .leftJoin(
          projectMembersTable,
          and(
            eq(
              projectMembersTable.projectId,
              projectsTable.id
            ),
            eq(projectMembersTable.userId, userId)
          )
        )
        .leftJoin(
          invitationsTable,
          and(
            eq(
              invitationsTable.organizationId,
              organizationsTable.id
            ),
            eq(invitationsTable.email, userEmail),
            eq(
              invitationsTable.status,
              InvitationStatus.Pending
            )
          )
        )
        .where(
          and(
            eq(membersTable.userId, userId),
            isNull(invitationsTable.id)
          )
        )
        .groupBy(
          organizationsTable.id,
          organizationsTable.name,
          organizationsTable.slug,
          organizationsTable.logo,
          organizationsTable.metadata,
          organizationsTable.createdAt,
          membersTable.role
        );

      // Transform to final format
      return result.map((row) => {
        return {
          organization: {
            id: row.orgId,
            name: row.orgName,
            slug: row.orgSlug,
            logo: row.orgLogo,
            metadata: row.orgMetadata,
            createdAt: row.orgCreatedAt,
          },
          userRole: row.userRole,
          projects: row.projects,
        };
      });
    }
  ),

  getById: protectedOrganizationMemberProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({ organizationId: OrganizationId })
      )
    )
    .query(async ({ ctx: { db }, input }) => {
      const { organizationId } = input;

      // Get organization details
      const [org] = await db
        .select({
          id: organizationsTable.id,
          name: organizationsTable.name,
          slug: organizationsTable.slug,
          logo: organizationsTable.logo,
          metadata: organizationsTable.metadata,
          createdAt: organizationsTable.createdAt,
        })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, organizationId))
        .limit(1);

      return { organization: org };
    }),

  createOrganization: protectedProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          name: Schema.String.pipe(
            Schema.minLength(1, {
              message: () =>
                "Organization name is required",
            }),
            Schema.maxLength(100, {
              message: () =>
                "Organization name must be less than 100 characters",
            })
          ),
          slug: Schema.optional(Schema.String),
        })
      )
    )
    .mutation(async ({ ctx: { session, db }, input }) => {
      const { name } = input;
      const userId = session.user.id;

      // Create organization
      const [organization] = await db
        .insert(organizationsTable)
        .values({
          name,
        })
        .returning();

      // Add user as owner in members table
      await db.insert(membersTable).values({
        userId,
        organizationId: organization!.id,
        role: "owner",
      });

      return { organization };
    }),

  // Set organization name (task-based UI)
  setOrganizationName: protectedOrganizationAdminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          organizationId: OrganizationId,
          name: Schema.String.pipe(
            Schema.minLength(3, {
              message: () =>
                "Organization name is required",
            })
          ),
        })
      )
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const { organizationId, name } = input;

      // Admin/owner check is done by protectedOrganizationAdminProcedure

      const [updated] = await db
        .update(organizationsTable)
        .set({ name })
        .where(eq(organizationsTable.id, organizationId))
        .returning();

      return { organization: updated };
    }),

  getOrganizationDetail:
    protectedOrganizationMemberProcedure
      .input(
        Schema.standardSchemaV1(
          Schema.Struct({ organizationId: OrganizationId })
        )
      )
      .query(async ({ ctx: { db }, input }) => {
        const { organizationId } = input;

        // Membership check is done by protectedOrganizationMemberProcedure

        // Get organization
        const orgRows = await db
          .select()
          .from(organizationsTable)
          .where(eq(organizationsTable.id, organizationId))
          .limit(1);

        if (orgRows.length === 0) {
          throw notFoundError("Organization not found");
        }

        const organization = orgRows[0];

        // Default tier to free (no active billing)
        const tier = "free";

        const projects = await db
          .select()
          .from(projectsTable)
          .where(
            eq(projectsTable.organizationId, organizationId)
          );

        // Fetch members with user info
        const members = await db
          .select({
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            role: membersTable.role,
            image: usersTable.image,
          })
          .from(membersTable)
          .leftJoin(
            usersTable,
            eq(membersTable.userId, usersTable.id)
          )
          .where(
            eq(membersTable.organizationId, organizationId)
          );

        return {
          organization: {
            ...organization,
            tier,
          },
          projects,
          members,
        };
      }),

  updateOrganization: protectedOrganizationAdminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          organizationId: OrganizationId,
          name: Schema.optional(
            Schema.String.pipe(Schema.minLength(3))
          ),
          logo: Schema.optional(Schema.String),
          metadata: Schema.optional(Schema.String),
        })
      )
    )
    .mutation(async ({ ctx: { db, member }, input }) => {
      const { organizationId, name, logo, metadata } =
        input;

      // Only owners and admins can update organizations
      if (
        !member ||
        !["owner", "admin"].includes(member.role)
      ) {
        throw forbiddenError(
          "Only organization owners and admins can update organizations"
        );
      }

      // Get current organization name for comparison
      const [currentOrg] = await db
        .select({
          name: organizationsTable.name,
        })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, organizationId))
        .limit(1);

      if (!currentOrg) {
        throw notFoundError("Organization not found");
      }

      // Build update object
      const updates: Partial<
        typeof organizationsTable.$inferInsert
      > = {};
      if (name !== undefined) updates.name = name;
      if (logo !== undefined) updates.logo = logo;
      if (metadata !== undefined)
        updates.metadata = metadata;

      // Update organization
      const [updated] = await db
        .update(organizationsTable)
        .set(updates)
        .where(eq(organizationsTable.id, organizationId))
        .returning();

      return { organization: updated };
    }),

  deleteOrganization: protectedOrganizationAdminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          organizationId: OrganizationId,
          confirmationName: Schema.String,
        })
      )
    )
    .mutation(async ({ ctx: { db, member }, input }) => {
      const { organizationId, confirmationName } = input;

      // Only owners can delete organizations (not admins)
      if (!member || member.role !== "owner") {
        throw forbiddenError(
          "Only organization owners can delete organizations"
        );
      }

      // Get organization details to verify name
      const org = await db
        .select({
          name: organizationsTable.name,
        })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, organizationId))
        .limit(1);

      if (org.length === 0) {
        throw notFoundError("Organization not found");
      }

      // Verify confirmation name matches
      if (org[0]!.name !== confirmationName) {
        throw forbiddenError(
          "Organization name confirmation does not match"
        );
      }

      // Delete organization (cascade will handle related records)
      await db
        .delete(organizationsTable)
        .where(eq(organizationsTable.id, organizationId));

      return { success: true };
    }),
  getOrganizationProjects:
    protectedOrganizationAdminProcedure.query(
      async ({ ctx: { db, member } }) => {
        const projects = await db
          .select({
            id: projectsTable.id,
            name: projectsTable.name,
            createdAt: projectsTable.createdAt,
          })
          .from(projectsTable)
          .where(
            eq(
              projectsTable.organizationId,
              member!.organizationId
            )
          );

        return projects;
      }
    ),

  /**
   * Get organization summary with latest project and member count.
   * Demonstrates using reusable LATERAL join subqueries for efficient data fetching.
   */
  getOrganizationsSummary: protectedProcedure.query(
    async ({ ctx: { session, db } }) => {
      const userId = session.user.id;

      // Create reusable subqueries
      const latestProjectSq =
        createLatestProjectSubquery(db);
      const memberCountSq = createMemberCountSubquery(db);

      // Single query with LATERAL joins - fetches orgs with latest project and member count
      const result = await db
        .select({
          // Organization data
          id: organizationsTable.id,
          name: organizationsTable.name,
          slug: organizationsTable.slug,
          logo: organizationsTable.logo,
          createdAt: organizationsTable.createdAt,
          // User's role
          userRole: membersTable.role,
          // Latest project (from LATERAL subquery)
          latestProject: {
            id: latestProjectSq.id,
            name: latestProjectSq.name,
            createdAt: latestProjectSq.createdAt,
          },
          // Member count (from LATERAL subquery)
          memberCount: memberCountSq.count,
        })
        .from(membersTable)
        .innerJoin(
          organizationsTable,
          eq(
            membersTable.organizationId,
            organizationsTable.id
          )
        )
        .leftJoinLateral(latestProjectSq, sql`true`)
        .leftJoinLateral(memberCountSq, sql`true`)
        .where(eq(membersTable.userId, userId))
        .orderBy(organizationsTable.name);

      return result.map((row) => ({
        organization: {
          id: row.id,
          name: row.name,
          slug: row.slug,
          logo: row.logo,
          createdAt: row.createdAt,
        },
        userRole: row.userRole,
        latestProject: row.latestProject?.id
          ? {
              id: row.latestProject.id,
              name: row.latestProject.name,
              createdAt: row.latestProject.createdAt,
            }
          : null,
        memberCount: row.memberCount ?? 0,
      }));
    }
  ),
} satisfies TRPCRouterRecord;
