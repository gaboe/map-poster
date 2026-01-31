import { Schema } from "effect";
import { protectedProcedure } from "./auth";
import {
  projectMembersTable,
  projectsTable,
  membersTable,
} from "@map-poster/db";
import { eq, and } from "drizzle-orm";
import {
  forbiddenError,
  notFoundError,
} from "@/infrastructure/errors";
import {
  OrganizationRoles,
  ProjectId,
  ProjectRoles,
} from "@map-poster/common";

export const protectedProjectMemberProcedure =
  protectedProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({ projectId: ProjectId })
      )
    )
    .use(async function hasProjectAccess(opts) {
      const { ctx, input } = opts;
      const { projectId } = input;
      const userId = ctx.session.user.id;

      // Single optimized query with JOINs to get all needed data
      const result = await ctx.db
        .select({
          // Project info
          projectId: projectsTable.id,
          projectName: projectsTable.name,
          organizationId: projectsTable.organizationId,
          projectCreatedAt: projectsTable.createdAt,

          // Organization membership (for admin override)
          orgMemberRole: membersTable.role,
          orgMemberId: membersTable.id,

          // Project-specific membership
          projectMemberRole: projectMembersTable.role,
          projectMemberId: projectMembersTable.id,
        })
        .from(projectsTable)
        .leftJoin(
          membersTable,
          and(
            eq(
              membersTable.organizationId,
              projectsTable.organizationId
            ),
            eq(membersTable.userId, userId)
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
        .where(eq(projectsTable.id, projectId))
        .limit(1);

      if (result.length === 0) {
        throw notFoundError("Project not found");
      }

      const data = result[0]!;

      // Check if user is organization admin/owner (automatic project admin)
      const isOrgAdmin =
        data.orgMemberRole === OrganizationRoles.Admin ||
        data.orgMemberRole === OrganizationRoles.Owner;

      if (isOrgAdmin) {
        return opts.next({
          ctx: {
            project: {
              id: data.projectId,
              name: data.projectName,
              organizationId: data.organizationId,
              createdAt: data.projectCreatedAt,
            },
            projectRole: ProjectRoles.Admin,
            orgRole: data.orgMemberRole,
            projectMemberId: null, // No explicit project membership needed
          },
        });
      }

      // Check if user has specific project membership
      if (!data.projectMemberId) {
        // Project exists but user has no access - don't reveal project existence
        throw notFoundError("Project not found");
      }

      return opts.next({
        ctx: {
          project: {
            id: data.projectId,
            name: data.projectName,
            organizationId: data.organizationId,
            createdAt: data.projectCreatedAt,
          },
          projectRole: data.projectMemberRole,
          orgRole: data.orgMemberRole || null,
          projectMemberId: data.projectMemberId,
        },
      });
    });

export const protectedProjectAdminProcedure =
  protectedProjectMemberProcedure.use(
    async function requiresProjectAdmin(opts) {
      const { ctx } = opts;

      // Check if user has admin access (either org admin or project admin)
      const isOrgAdmin =
        ctx.orgRole === OrganizationRoles.Admin ||
        ctx.orgRole === OrganizationRoles.Owner;
      if (
        isOrgAdmin ||
        ctx.projectRole === ProjectRoles.Admin
      ) {
        return opts.next({ ctx });
      }

      throw forbiddenError(
        "This action requires project admin permissions"
      );
    }
  );

export const protectedProjectEditorProcedure =
  protectedProjectMemberProcedure.use(
    async function requiresProjectEditor(opts) {
      const { ctx } = opts;

      // Check if user has editor access (org admin, project admin, or project editor)
      const isOrgAdmin =
        ctx.orgRole === OrganizationRoles.Admin ||
        ctx.orgRole === OrganizationRoles.Owner;
      if (
        isOrgAdmin ||
        ctx.projectRole === ProjectRoles.Admin ||
        ctx.projectRole === ProjectRoles.Editor
      ) {
        return opts.next({ ctx });
      }

      throw forbiddenError(
        "This action requires project editor permissions"
      );
    }
  );
