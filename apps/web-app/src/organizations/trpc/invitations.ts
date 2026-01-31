import type { TRPCRouterRecord } from "@trpc/server";
import {
  protectedProcedure,
  publicProcedure,
} from "@/infrastructure/trpc/procedures/auth";
import {
  protectedOrganizationAdminProcedure,
  protectedOrganizationMemberProcedure,
} from "@/infrastructure/trpc/procedures/organization";
import { eq, and, gt, desc, inArray } from "drizzle-orm";
import {
  invitationsTable,
  membersTable,
  organizationsTable,
  usersTable,
  projectMembersTable,
  projectsTable,
} from "@map-poster/db";
import { Schema } from "effect";
import {
  Email,
  InvitationId,
  InvitationStatus,
  OrganizationId,
  OrganizationRoles,
  OrganizationRoleSchema,
  ProjectId,
  ProjectRoleSchema,
  type UserId,
} from "@map-poster/common";
import {
  badRequestError,
  forbiddenError,
  notFoundError,
} from "@/infrastructure/errors";

export const router = {
  createBulkInvitations: protectedOrganizationAdminProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({
          emails: Schema.Array(Email).pipe(
            Schema.minItems(1, {
              message: () =>
                "At least one email is required",
            })
          ),
          organizationId: OrganizationId,
          organizationRole: Schema.optionalWith(
            OrganizationRoleSchema,
            {
              default: () => OrganizationRoles.Member,
            }
          ),
          projectAssignments: Schema.optional(
            Schema.Array(
              Schema.Struct({
                projectId: ProjectId,
                role: ProjectRoleSchema,
              })
            )
          ),
        })
      )
    )
    .mutation(async ({ ctx: { session, db }, input }) => {
      const {
        emails,
        organizationId,
        organizationRole,
        projectAssignments,
      } = input;
      const userId = session.user.id;

      // Get organization details
      const [organization] = await db
        .select({ name: organizationsTable.name })
        .from(organizationsTable)
        .where(eq(organizationsTable.id, organizationId))
        .limit(1);

      if (!organization) {
        throw badRequestError("Organization not found");
      }

      // Process each email individually
      const results = await Promise.allSettled(
        emails.map(async (email) => {
          try {
            // Check if user already exists
            const existingUser = await db
              .select({
                id: usersTable.id,
                emailVerified: usersTable.emailVerified,
              })
              .from(usersTable)
              .where(eq(usersTable.email, email))
              .limit(1);

            let targetUserId: UserId;

            if (existingUser.length > 0) {
              targetUserId = existingUser[0]!.id;

              // Check if already a member
              const existingMember = await db
                .select()
                .from(membersTable)
                .where(
                  and(
                    eq(
                      membersTable.organizationId,
                      organizationId
                    ),
                    eq(membersTable.userId, targetUserId)
                  )
                )
                .limit(1);

              if (existingMember.length > 0) {
                throw new Error(
                  "User is already a member of this organization"
                );
              }
            } else {
              // Create placeholder user
              const [placeholder] = await db
                .insert(usersTable)
                .values({
                  email,
                  name: email, // Temporary name
                  emailVerified: false, // Marks as placeholder
                })
                .returning();

              targetUserId = placeholder!.id;
            }

            // Check if invitation already exists
            const existingInvitation = await db
              .select()
              .from(invitationsTable)
              .where(
                and(
                  eq(invitationsTable.email, email),
                  eq(
                    invitationsTable.organizationId,
                    organizationId
                  ),
                  eq(
                    invitationsTable.status,
                    InvitationStatus.Pending
                  )
                )
              )
              .limit(1);

            if (existingInvitation.length > 0) {
              throw new Error(
                "Invitation already exists for this email"
              );
            }

            // Add user to organization
            await db.insert(membersTable).values({
              userId: targetUserId,
              organizationId,
              role: organizationRole,
            });

            // Add project permissions if specified
            if (
              projectAssignments &&
              projectAssignments.length > 0
            ) {
              const projectIds = projectAssignments.map(
                (assignment) => assignment.projectId
              );

              // Remove any leftover project assignments for this user to avoid unique violations
              await db
                .delete(projectMembersTable)
                .where(
                  and(
                    eq(
                      projectMembersTable.userId,
                      targetUserId
                    ),
                    inArray(
                      projectMembersTable.projectId,
                      projectIds
                    )
                  )
                );

              await db.insert(projectMembersTable).values(
                projectAssignments.map((assignment) => ({
                  userId: targetUserId,
                  projectId: assignment.projectId,
                  role: assignment.role,
                }))
              );
            }

            // Create invitation record for tracking
            const expiresAt = new Date();
            expiresAt.setFullYear(
              expiresAt.getFullYear() + 1
            );

            const [invitation] = await db
              .insert(invitationsTable)
              .values({
                email,
                inviterId: userId,
                organizationId,
                role: organizationRole,
                status: InvitationStatus.Pending,
                expiresAt,
              })
              .returning();

            return {
              email,
              success: true,
              invitationId: invitation!.id,
              userId: targetUserId,
            };
          } catch (error) {
            return {
              email,
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error",
            };
          }
        })
      );

      // Transform results
      const invitationResults = results.map((result) => {
        if (result.status === "fulfilled") {
          return result.value;
        }
        return {
          email: "",
          success: false,
          error:
            result.reason?.message ||
            "Failed to process invitation",
        };
      });

      return {
        results: invitationResults,
        organizationName: organization.name,
      };
    }),

  getInvitations: protectedOrganizationMemberProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({ organizationId: OrganizationId })
      )
    )
    .query(async ({ ctx: { db }, input }) => {
      const { organizationId } = input;

      // Get only pending invitations for the organization
      const invitations = await db
        .select({
          id: invitationsTable.id,
          email: invitationsTable.email,
          role: invitationsTable.role,
          status: invitationsTable.status,
          expiresAt: invitationsTable.expiresAt,
          createdAt: invitationsTable.createdAt,
          inviterName: usersTable.name,
          inviterEmail: usersTable.email,
        })
        .from(invitationsTable)
        .leftJoin(
          usersTable,
          eq(invitationsTable.inviterId, usersTable.id)
        )
        .where(
          and(
            eq(
              invitationsTable.organizationId,
              organizationId
            ),
            eq(
              invitationsTable.status,
              InvitationStatus.Pending
            )
          )
        )
        .orderBy(invitationsTable.createdAt);

      return invitations;
    }),

  deleteInvitation: protectedProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({ invitationId: InvitationId })
      )
    )
    .mutation(async ({ ctx: { session, db }, input }) => {
      const { invitationId } = input;
      const userId = session.user.id;

      // Get invitation details
      const [invitation] = await db
        .select()
        .from(invitationsTable)
        .where(eq(invitationsTable.id, invitationId))
        .limit(1);

      if (!invitation) {
        throw notFoundError("Invitation not found");
      }

      // Check if user is owner/admin of the organization or the inviter
      const userMembership = await db
        .select()
        .from(membersTable)
        .where(
          and(
            eq(
              membersTable.organizationId,
              invitation.organizationId
            ),
            eq(membersTable.userId, userId)
          )
        )
        .limit(1);

      const canDelete =
        invitation.inviterId === userId ||
        (userMembership.length > 0 &&
          ["owner", "admin"].includes(
            userMembership[0]!.role
          ));

      if (!canDelete) {
        throw forbiddenError(
          "You don't have permission to delete this invitation"
        );
      }

      // Delete invitation
      await db
        .delete(invitationsTable)
        .where(eq(invitationsTable.id, invitationId));

      return { success: true };
    }),

  getInvitationDetails: publicProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({ invitationId: InvitationId })
      )
    )
    .query(async ({ ctx: { db }, input }) => {
      const { invitationId } = input;

      // Get invitation with organization and inviter details
      const invitation = await db
        .select({
          id: invitationsTable.id,
          email: invitationsTable.email,
          role: invitationsTable.role,
          status: invitationsTable.status,
          expiresAt: invitationsTable.expiresAt,
          createdAt: invitationsTable.createdAt,
          organizationId: invitationsTable.organizationId,
          organizationName: organizationsTable.name,
          inviterName: usersTable.name,
          inviterEmail: usersTable.email,
        })
        .from(invitationsTable)
        .leftJoin(
          organizationsTable,
          eq(
            invitationsTable.organizationId,
            organizationsTable.id
          )
        )
        .leftJoin(
          usersTable,
          eq(invitationsTable.inviterId, usersTable.id)
        )
        .where(
          and(
            eq(invitationsTable.id, invitationId),
            eq(
              invitationsTable.status,
              InvitationStatus.Pending
            )
          )
        )
        .limit(1);

      if (invitation.length === 0) {
        throw notFoundError(
          "Invitation not found or has been used"
        );
      }

      return invitation[0];
    }),

  acceptInvitation: protectedProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({ invitationId: InvitationId })
      )
    )
    .mutation(async ({ ctx: { session, db }, input }) => {
      const { invitationId } = input;
      const userId = session.user.id;
      const userEmail = session.user.email;

      // Get invitation details
      const [invitation] = await db
        .select()
        .from(invitationsTable)
        .where(
          and(
            eq(invitationsTable.id, invitationId),
            eq(
              invitationsTable.status,
              InvitationStatus.Pending
            )
          )
        )
        .limit(1);

      // Return failure responses for expected business cases (not errors)
      if (!invitation) {
        return {
          success: false as const,
          reason: "not_found" as const,
        };
      }

      // Check if invitation has expired
      if (new Date(invitation.expiresAt) < new Date()) {
        return {
          success: false as const,
          reason: "expired" as const,
        };
      }

      // Check if user email matches invitation email
      if (userEmail !== invitation.email) {
        return {
          success: false as const,
          reason: "email_mismatch" as const,
        };
      }

      // Check if user is already a member (for pre-added placeholder users)
      const existingMember = await db
        .select()
        .from(membersTable)
        .where(
          and(
            eq(
              membersTable.organizationId,
              invitation.organizationId
            ),
            eq(membersTable.userId, userId)
          )
        )
        .limit(1);

      // If user is already a member, just confirm the invitation
      if (existingMember.length > 0) {
        // Mark invitation as accepted
        await db
          .update(invitationsTable)
          .set({ status: InvitationStatus.Accepted })
          .where(eq(invitationsTable.id, invitationId));

        return {
          success: true as const,
          organizationId: invitation.organizationId,
          role: invitation.role,
        };
      }

      // Check organization exists
      const [organization] = await db
        .select({
          id: organizationsTable.id,
        })
        .from(organizationsTable)
        .where(
          eq(
            organizationsTable.id,
            invitation.organizationId
          )
        )
        .limit(1);

      if (!organization) {
        throw notFoundError("Organization not found");
      }

      // Add user as member
      await db.insert(membersTable).values({
        userId,
        organizationId: invitation.organizationId,
        role: invitation.role || "member",
      });

      // Mark invitation as accepted
      await db
        .update(invitationsTable)
        .set({ status: InvitationStatus.Accepted })
        .where(eq(invitationsTable.id, invitationId));

      return {
        success: true as const,
        organizationId: invitation.organizationId,
        role: invitation.role,
      };
    }),

  dismissInvitation: protectedProcedure
    .input(
      Schema.standardSchemaV1(
        Schema.Struct({ invitationId: InvitationId })
      )
    )
    .mutation(async ({ ctx: { session, db }, input }) => {
      const { invitationId } = input;
      const userEmail = session.user.email;
      const userId = session.user.id;

      // Get invitation details
      const [invitation] = await db
        .select()
        .from(invitationsTable)
        .where(eq(invitationsTable.id, invitationId))
        .limit(1);

      if (!invitation) {
        throw notFoundError("Invitation not found");
      }

      // Check if user email matches invitation email
      if (userEmail !== invitation.email) {
        throw forbiddenError(
          "You can only dismiss invitations sent to your email"
        );
      }

      // Remove user from organization (if they exist as member)
      await db
        .delete(membersTable)
        .where(
          and(
            eq(
              membersTable.organizationId,
              invitation.organizationId
            ),
            eq(membersTable.userId, userId)
          )
        );

      // Remove user from projects that belong to this organization
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
                    invitation.organizationId
                  )
                )
            )
          )
        );

      // Update invitation status to dismissed
      await db
        .update(invitationsTable)
        .set({ status: InvitationStatus.Dismissed })
        .where(eq(invitationsTable.id, invitationId));

      return { success: true };
    }),

  getPendingInvitationsForUser: protectedProcedure.query(
    async ({ ctx: { session, db } }) => {
      const userEmail = session.user.email;

      // Get pending invitations for the user's email
      const invitations = await db
        .select({
          id: invitationsTable.id,
          email: invitationsTable.email,
          role: invitationsTable.role,
          status: invitationsTable.status,
          expiresAt: invitationsTable.expiresAt,
          createdAt: invitationsTable.createdAt,
          organizationId: invitationsTable.organizationId,
          organizationName: organizationsTable.name,
          inviterName: usersTable.name,
          inviterEmail: usersTable.email,
        })
        .from(invitationsTable)
        .leftJoin(
          organizationsTable,
          eq(
            invitationsTable.organizationId,
            organizationsTable.id
          )
        )
        .leftJoin(
          usersTable,
          eq(invitationsTable.inviterId, usersTable.id)
        )
        .where(
          and(
            eq(invitationsTable.email, userEmail),
            eq(
              invitationsTable.status,
              InvitationStatus.Pending
            ),
            // Only show non-expired invitations
            gt(invitationsTable.expiresAt, new Date())
          )
        )
        .orderBy(desc(invitationsTable.createdAt));

      return invitations;
    }
  ),
} satisfies TRPCRouterRecord;
