import type { TRPCRouterRecord } from "@trpc/server";
import { Schema } from "effect";

import {
  protectedOrganizationAdminProcedure,
  protectedOrganizationMemberProcedure,
} from "@/infrastructure/trpc/procedures/organization";
import {
  protectedProjectMemberProcedure,
  protectedProjectAdminProcedure,
} from "@/infrastructure/trpc/procedures/project-access";
import { projectsTable } from "@map-poster/db";
import {
  OrganizationId,
  ProjectId,
} from "@map-poster/common";
import { and, eq } from "drizzle-orm";
import {
  forbiddenError,
  notFoundError,
} from "@/infrastructure/errors";

export const router = {
  getById: protectedProjectMemberProcedure.query(
    async ({ ctx: { project } }) => {
      return { project };
    }
  ),

  createProject: protectedOrganizationMemberProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          organizationId: OrganizationId,
          name: Schema.String.pipe(
            Schema.minLength(1, {
              message: () => "Project name is required",
            }),
            Schema.maxLength(100, {
              message: () =>
                "Project name must be less than 100 characters",
            })
          ),
        })
      )
    )
    .mutation(async ({ ctx: { db }, input }) => {
      // Organization membership already validated by middleware
      // Insert a new project for the given organization
      const [project] = await db
        .insert(projectsTable)
        .values({
          name: input.name,
          organizationId: input.organizationId,
        })
        .returning();

      return { project };
    }),

  updateProjectName: protectedProjectAdminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          projectId: ProjectId,
          name: Schema.String.pipe(
            Schema.minLength(1, {
              message: () => "Project name is required",
            }),
            Schema.maxLength(100, {
              message: () =>
                "Project name must be less than 100 characters",
            })
          ),
        })
      )
    )
    .mutation(async ({ ctx: { db }, input }) => {
      // Update the project name
      const [updatedProject] = await db
        .update(projectsTable)
        .set({ name: input.name })
        .where(eq(projectsTable.id, input.projectId))
        .returning();

      return { project: updatedProject };
    }),

  deleteProject: protectedOrganizationAdminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          organizationId: OrganizationId,
          projectId: ProjectId,
          confirmationName: Schema.String,
        })
      )
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const {
        projectId,
        confirmationName,
        organizationId,
      } = input;

      // Get the project and verify it belongs to the organization
      const project =
        await db.query.projectsTable.findFirst({
          where: and(
            eq(projectsTable.id, projectId),
            eq(projectsTable.organizationId, organizationId)
          ),
        });

      if (!project) {
        throw notFoundError(
          "Project not found in this organization"
        );
      }

      // Verify confirmation name matches
      if (project.name !== confirmationName) {
        throw forbiddenError(
          "Project name confirmation does not match"
        );
      }

      // Delete project (cascade will handle related records like API keys)
      await db
        .delete(projectsTable)
        .where(eq(projectsTable.id, projectId));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
