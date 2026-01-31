import type { TRPCRouterRecord } from "@trpc/server";
import {
  protectedOrganizationMemberProcedure,
  protectedOrganizationAdminProcedure,
} from "@/infrastructure/trpc/procedures/organization";
import { eq, and, inArray } from "drizzle-orm";
import {
  membersTable,
  usersTable,
  invitationsTable,
  projectMembersTable,
  projectsTable,
} from "@map-poster/db";
import { Schema } from "effect";
import {
  OrganizationRoles,
  InvitationStatus,
  OrganizationId,
  UserId,
  OrganizationRoleSchema,
} from "@map-poster/common";
import {
  notFoundError,
  badRequestError,
} from "@/infrastructure/errors";

export const router = {
  getMembersByOrganizationId:
    protectedOrganizationMemberProcedure
      .input(
        Schema.standardSchemaV1(
          Schema.Struct({ organizationId: OrganizationId })
        )
      )
      .query(async ({ ctx: { db }, input }) => {
        const { organizationId } = input;

        // Organization membership already validated by middleware
        // Get only actual members (users who have already joined)
        const members = await db
          .select({
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            role: membersTable.role,
            image: usersTable.image,
            memberId: membersTable.id,
            emailVerified: usersTable.emailVerified,
          })
          .from(membersTable)
          .leftJoin(
            usersTable,
            eq(membersTable.userId, usersTable.id)
          )
          .where(
            eq(membersTable.organizationId, organizationId)
          );

        return members;
      }),

  updateMemberRole: protectedOrganizationAdminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          organizationId: OrganizationId,
          userId: UserId,
          newRole: OrganizationRoleSchema,
        })
      )
    )
    .mutation(async ({ ctx: { db }, input }) => {
      const { organizationId, userId, newRole } = input;

      // Admin/owner permission already validated by middleware

      // Check if target member exists
      const targetMember = await db
        .select()
        .from(membersTable)
        .where(
          and(
            eq(membersTable.organizationId, organizationId),
            eq(membersTable.userId, userId)
          )
        )
        .limit(1);

      if (targetMember.length === 0) {
        throw notFoundError("Member not found");
      }

      // Prevent demoting the last owner
      if (
        targetMember[0]!.role === OrganizationRoles.Owner &&
        newRole !== OrganizationRoles.Owner
      ) {
        const ownerCount = await db
          .select({ count: membersTable.id })
          .from(membersTable)
          .where(
            and(
              eq(
                membersTable.organizationId,
                organizationId
              ),
              eq(membersTable.role, OrganizationRoles.Owner)
            )
          );

        if (
          ownerCount.length > 0 &&
          ownerCount[0]!.count === "1"
        ) {
          throw badRequestError(
            "Cannot demote the last owner of the organization"
          );
        }
      }

      // Update the role
      await db
        .update(membersTable)
        .set({ role: newRole })
        .where(
          and(
            eq(membersTable.organizationId, organizationId),
            eq(membersTable.userId, userId)
          )
        );

      return { success: true };
    }),

  removeMember: protectedOrganizationAdminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          organizationId: OrganizationId,
          userId: UserId,
        })
      )
    )
    .mutation(async ({ ctx: { session, db }, input }) => {
      const { organizationId, userId } = input;
      const currentUserId = session.user.id;

      // Admin/owner permission already validated by middleware

      // Prevent self-removal
      if (currentUserId === userId) {
        throw badRequestError(
          "You cannot remove yourself from the organization"
        );
      }

      // Get user info first to determine if this is a placeholder or real user
      const targetUser = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          emailVerified: usersTable.emailVerified,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      if (targetUser.length === 0) {
        throw notFoundError("User not found");
      }

      const user = targetUser[0]!;
      const isPlaceholderUser = !user.emailVerified;

      // Try to find in members table (actual member or placeholder)
      const targetMember = await db
        .select()
        .from(membersTable)
        .where(
          and(
            eq(membersTable.organizationId, organizationId),
            eq(membersTable.userId, userId)
          )
        )
        .limit(1);

      if (targetMember.length > 0) {
        const member = targetMember[0]!;

        // Prevent removing the last owner (only for real users, not placeholders)
        if (
          !isPlaceholderUser &&
          member.role === OrganizationRoles.Owner
        ) {
          const ownerCount = await db
            .select({ count: membersTable.id })
            .from(membersTable)
            .leftJoin(
              usersTable,
              eq(membersTable.userId, usersTable.id)
            )
            .where(
              and(
                eq(
                  membersTable.organizationId,
                  organizationId
                ),
                eq(
                  membersTable.role,
                  OrganizationRoles.Owner
                ),
                // Only count real owners, not placeholder owners
                eq(usersTable.emailVerified, true)
              )
            );

          if (
            ownerCount.length > 0 &&
            ownerCount[0]!.count === "1"
          ) {
            throw badRequestError(
              "Cannot remove the last owner of the organization"
            );
          }
        }

        // Remove the member from members table
        await db
          .delete(membersTable)
          .where(
            and(
              eq(
                membersTable.organizationId,
                organizationId
              ),
              eq(membersTable.userId, userId)
            )
          );

        // Remove project-level memberships for this organization
        await db
          .delete(projectMembersTable)
          .where(
            and(
              eq(projectMembersTable.userId, userId),
              inArray(
                projectMembersTable.projectId,
                db
                  .select({ id: projectsTable.id })
                  .from(projectsTable)
                  .where(
                    eq(
                      projectsTable.organizationId,
                      organizationId
                    )
                  )
              )
            )
          );

        // If this is a placeholder user, also remove:
        // 1. The placeholder user from users table
        // 2. The pending invitation record
        if (isPlaceholderUser) {
          // Remove placeholder user
          await db
            .delete(usersTable)
            .where(eq(usersTable.id, userId));

          // Remove pending invitation for this email
          await db
            .delete(invitationsTable)
            .where(
              and(
                eq(
                  invitationsTable.organizationId,
                  organizationId
                ),
                eq(invitationsTable.email, user.email),
                eq(
                  invitationsTable.status,
                  InvitationStatus.Pending
                )
              )
            );
        } else {
          // For real users, just remove any pending invitations for this email
          await db
            .delete(invitationsTable)
            .where(
              and(
                eq(
                  invitationsTable.organizationId,
                  organizationId
                ),
                eq(invitationsTable.email, user.email),
                eq(
                  invitationsTable.status,
                  InvitationStatus.Pending
                )
              )
            );
        }
      } else {
        throw notFoundError(
          "Member not found in organization"
        );
      }

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
