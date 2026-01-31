import type { TRPCRouterRecord } from "@trpc/server";
import { Schema } from "effect";
import { protectedProcedure } from "@/infrastructure/trpc/procedures/auth";
import { protectedOrganizationAdminProcedure } from "@/infrastructure/trpc/procedures/organization";
import {
  protectedProjectAdminProcedure,
  protectedProjectMemberProcedure,
} from "@/infrastructure/trpc/procedures/project-access";
import {
  projectMembersTable,
  usersTable,
  membersTable,
  projectsTable,
  organizationsTable,
} from "@map-poster/db";
import { eq, and, or, sql, inArray } from "drizzle-orm";
import {
  OrganizationId,
  ProjectId,
  UserId,
  ProjectRoleSchema,
} from "@map-poster/common";
import { badRequestError } from "@/infrastructure/errors";

export const projectPermissionsRouter = {
  // Get members for a specific project
  getProjectMembers: protectedProjectMemberProcedure.query(
    async ({ ctx: { db, project } }) => {
      const members = await db
        .select({
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
          image: usersTable.image,
          role: projectMembersTable.role,
          createdAt: projectMembersTable.createdAt,
        })
        .from(projectMembersTable)
        .leftJoin(
          usersTable,
          eq(projectMembersTable.userId, usersTable.id)
        )
        .where(
          eq(projectMembersTable.projectId, project.id)
        );

      return members;
    }
  ),

  // Get organization members with their project access
  getOrganizationMembersWithProjectAccess:
    protectedOrganizationAdminProcedure
      .input(
        Schema.standardSchemaV1(
          Schema.Struct({
            organizationId: OrganizationId,
            projectId: Schema.optional(ProjectId),
          })
        )
      )
      .query(async ({ ctx: { db }, input }) => {
        const members = await db
          .select({
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            image: usersTable.image,
            organizationRole: membersTable.role,
            projectRole: projectMembersTable.role,
            hasProjectAccess: projectMembersTable.id,
          })
          .from(membersTable)
          .leftJoin(
            usersTable,
            eq(membersTable.userId, usersTable.id)
          )
          .leftJoin(
            projectMembersTable,
            and(
              eq(
                projectMembersTable.userId,
                membersTable.userId
              ),
              input.projectId
                ? eq(
                    projectMembersTable.projectId,
                    input.projectId
                  )
                : undefined
            )
          )
          .where(
            eq(
              membersTable.organizationId,
              input.organizationId
            )
          );

        return members.map((member) => ({
          ...member,
          hasProjectAccess: Boolean(
            member.hasProjectAccess
          ),
          effectiveProjectRole:
            member.organizationRole === "admin" ||
            member.organizationRole === "owner"
              ? "admin" // Org admins get automatic project admin
              : member.projectRole,
        }));
      }),

  // Add user to project
  addProjectMember: protectedProjectAdminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          userId: UserId,
          role: ProjectRoleSchema,
        })
      )
    )
    .mutation(
      async ({
        ctx: { db, project },
        input: { userId, role },
      }) => {
        // Verify user is organization member
        const orgMember = await db
          .select()
          .from(membersTable)
          .where(
            and(
              eq(
                membersTable.organizationId,
                project.organizationId
              ),
              eq(membersTable.userId, userId)
            )
          )
          .limit(1);

        if (!orgMember.length) {
          throw badRequestError(
            "User must be an organization member first"
          );
        }

        // Skip if user is org admin (automatic access)
        if (
          orgMember[0]!.role === "admin" ||
          orgMember[0]!.role === "owner"
        ) {
          throw badRequestError(
            "Organization admins have automatic project access"
          );
        }

        // Check if user already has project access
        const existingProjectMember = await db
          .select()
          .from(projectMembersTable)
          .where(
            and(
              eq(projectMembersTable.userId, userId),
              eq(projectMembersTable.projectId, project.id)
            )
          )
          .limit(1);

        if (existingProjectMember.length > 0) {
          throw badRequestError(
            "User already has access to this project"
          );
        }

        // Add project membership
        await db.insert(projectMembersTable).values({
          userId,
          projectId: project.id,
          role,
        });

        return { success: true };
      }
    ),

  // Update project member role
  updateProjectMemberRole: protectedProjectAdminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          userId: UserId,
          role: ProjectRoleSchema,
        })
      )
    )
    .mutation(
      async ({
        ctx: { db, project },
        input: { userId, role },
      }) => {
        await db
          .update(projectMembersTable)
          .set({ role })
          .where(
            and(
              eq(projectMembersTable.projectId, project.id),
              eq(projectMembersTable.userId, userId)
            )
          );

        return { success: true };
      }
    ),

  // Remove user from project
  removeProjectMember: protectedProjectAdminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          userId: UserId,
        })
      )
    )
    .mutation(
      async ({
        ctx: { db, project },
        input: { userId },
      }) => {
        await db
          .delete(projectMembersTable)
          .where(
            and(
              eq(projectMembersTable.projectId, project.id),
              eq(projectMembersTable.userId, userId)
            )
          );

        return { success: true };
      }
    ),

  // Get organization members with their project permissions across all projects
  getOrganizationMembersWithAllProjectPermissions:
    protectedOrganizationAdminProcedure
      .input(
        Schema.standardSchemaV1(
          Schema.Struct({
            organizationId: OrganizationId,
          })
        )
      )
      .query(async ({ ctx: { db }, input }) => {
        // Optimized single query with JSON aggregation
        const result = await db
          .select({
            userId: usersTable.id,
            userName: usersTable.name,
            userEmail: usersTable.email,
            userImage: usersTable.image,
            organizationRole: membersTable.role,
            projectPermissions: sql<
              Array<{
                projectId: string;
                projectName: string;
                role: string | null;
                hasAccess: boolean;
                effectiveRole?: string;
              }>
            >`
              json_agg(
                jsonb_build_object(
                  'projectId', ${projectsTable.id},
                  'projectName', ${projectsTable.name},
                  'role', CASE
                    WHEN ${membersTable.role} IN ('admin', 'owner') THEN 'admin'
                    ELSE ${projectMembersTable.role}
                  END,
                  'hasAccess', CASE
                    WHEN ${membersTable.role} IN ('admin', 'owner') THEN true
                    WHEN ${projectMembersTable.id} IS NOT NULL THEN true
                    ELSE false
                  END,
                  'effectiveRole', CASE
                    WHEN ${membersTable.role} IN ('admin', 'owner') THEN 'admin'
                    ELSE ${projectMembersTable.role}
                  END
                ) ORDER BY ${projectsTable.name}
              ) FILTER (WHERE ${projectsTable.id} IS NOT NULL)
            `.as("project_permissions"),
          })
          .from(membersTable)
          .leftJoin(
            usersTable,
            eq(membersTable.userId, usersTable.id)
          )
          .leftJoin(
            projectsTable,
            eq(
              projectsTable.organizationId,
              input.organizationId
            )
          )
          .leftJoin(
            projectMembersTable,
            and(
              eq(
                projectMembersTable.userId,
                membersTable.userId
              ),
              eq(
                projectMembersTable.projectId,
                projectsTable.id
              )
            )
          )
          .where(
            eq(
              membersTable.organizationId,
              input.organizationId
            )
          )
          .groupBy(
            usersTable.id,
            usersTable.name,
            usersTable.email,
            usersTable.image,
            membersTable.role
          );

        // Transform result to match expected format
        const members = result
          .filter((member) => member.userId)
          .map((member) => ({
            id: member.userId!,
            name: member.userName,
            email: member.userEmail,
            image: member.userImage,
            organizationRole: member.organizationRole,
            projectPermissions:
              member.projectPermissions || [],
          }));

        // Extract unique projects from the first member's permissions
        // (all members have the same projects due to CROSS JOIN)
        const projects =
          members.length > 0
            ? members[0]!.projectPermissions
                .map((p) => ({
                  id: p.projectId,
                  name: p.projectName,
                }))
                .sort((a, b) =>
                  a.name.localeCompare(b.name)
                )
            : [];

        return {
          members,
          projects,
        };
      }),

  // Return all projects the current user can access across all organizations
  // - Org owners/admins: all projects in their organizations
  // - Org members: only projects with explicit project membership
  getAccessibleProjectsForUser: protectedProcedure.query(
    async ({ ctx: { db, session } }) => {
      const userId = session.user.id;

      // Single-query approach: include organization name and filter at SQL level
      const rows = await db
        .select({
          organizationId: organizationsTable.id,
          organizationName: organizationsTable.name,
          id: projectsTable.id,
          name: projectsTable.name,
        })
        .from(membersTable)
        .innerJoin(
          organizationsTable,
          eq(
            organizationsTable.id,
            membersTable.organizationId
          )
        )
        .innerJoin(
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
            eq(
              projectMembersTable.userId,
              membersTable.userId
            )
          )
        )
        .where(
          and(
            eq(membersTable.userId, userId),
            // Org admins/owners see all org projects; members see projects where they have explicit access
            or(
              inArray(membersTable.role, [
                "admin",
                "owner",
              ]),
              sql`${projectMembersTable.id} is not null`
            )
          )
        );

      return rows.map((r) => ({
        organizationId: r.organizationId!,
        organizationName: r.organizationName!,
        id: r.id!,
        name: r.name!,
      }));
    }
  ),
} satisfies TRPCRouterRecord;
