import { Schema } from "effect";
import { eq, and, or } from "drizzle-orm";
import {
  membersTable,
  projectsTable,
} from "@map-poster/db";
import {
  forbiddenError,
  notFoundError,
} from "@/infrastructure/errors";
import { protectedProcedure } from "./auth";
import {
  OrganizationId,
  ProjectId,
} from "@map-poster/common";

// Procedure that validates user is a member of the organization
// Expects input to contain organizationId
export const protectedOrganizationMemberProcedure =
  protectedProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({ organizationId: OrganizationId })
      )
    )
    .use(async function isMemberOfOrganization(opts) {
      const { ctx, input } = opts;
      const { organizationId } = input;

      // Check if user is a member of this organization
      const memberAccess = await ctx.db
        .select()
        .from(membersTable)
        .where(
          and(
            eq(membersTable.organizationId, organizationId),
            eq(membersTable.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (memberAccess.length === 0) {
        throw forbiddenError(
          "You are not a member of this organization"
        );
      }

      // Return the member information in context for potential use
      const member = memberAccess[0];
      return opts.next({
        ctx: {
          ...opts.ctx,
          member,
        },
      });
    });

// Procedure that validates user is an admin of the organization
// Expects input to contain organizationId
export const protectedOrganizationAdminProcedure =
  protectedProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({ organizationId: OrganizationId })
      )
    )
    .use(async function isAdminOfOrganization(opts) {
      const { ctx, input } = opts;
      const { organizationId } = input;

      // Check if user is an admin or owner of this organization
      const memberAccess = await ctx.db
        .select()
        .from(membersTable)
        .where(
          and(
            eq(membersTable.organizationId, organizationId),
            eq(membersTable.userId, ctx.session.user.id),
            or(
              eq(membersTable.role, "admin"),
              eq(membersTable.role, "owner")
            )
          )
        )
        .limit(1);

      if (memberAccess.length === 0) {
        throw forbiddenError(
          "Only organization admins and owners can access this resource"
        );
      }

      // Return the admin member information in context
      const member = memberAccess[0];
      return opts.next({
        ctx: {
          ...opts.ctx,
          member,
        },
      });
    });

// Procedure that validates user has access to project via organization membership
// Expects input to contain projectId
export const protectedProjectMemberProcedure =
  protectedProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({ projectId: ProjectId })
      )
    )
    .use(
      async function isMemberOfProjectOrganization(opts) {
        const { ctx, input } = opts;
        const { projectId } = input;

        // First, get project to find its organization
        const project =
          await ctx.db.query.projectsTable.findFirst({
            where: eq(projectsTable.id, projectId),
          });

        if (!project) {
          throw notFoundError("Project not found");
        }

        // Check if user is a member of project's organization
        const memberAccess = await ctx.db
          .select()
          .from(membersTable)
          .where(
            and(
              eq(
                membersTable.organizationId,
                project.organizationId
              ),
              eq(membersTable.userId, ctx.session.user.id)
            )
          )
          .limit(1);

        if (memberAccess.length === 0) {
          throw forbiddenError(
            "You are not a member of this project's organization"
          );
        }

        // Return the member and project information in context
        const member = memberAccess[0];
        return opts.next({
          ctx: {
            ...opts.ctx,
            member,
            project,
          },
        });
      }
    );
