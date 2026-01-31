import type { TRPCRouterRecord } from "@trpc/server";
import {
  protectedProcedure,
  publicProcedure,
} from "@/infrastructure/trpc/procedures/auth";
import {
  organizationsTable,
  membersTable,
  projectsTable,
  invitationsTable,
} from "@map-poster/db";
import { eq, and, gt } from "drizzle-orm";

export const router = {
  getInfo: publicProcedure.query(
    async ({ ctx: { session } }) => {
      if (!session) {
        return null;
      }
      return session?.user;
    }
  ),

  getOnboardingStatus: protectedProcedure.query(
    async ({ ctx: { session, db } }) => {
      const user = session.user;

      // Find organizations where user is a member (Better Auth style)
      const userMemberships = await db
        .select({
          organizationId: membersTable.organizationId,
          role: membersTable.role,
          organization: {
            id: organizationsTable.id,
            name: organizationsTable.name,
            slug: organizationsTable.slug,
            logo: organizationsTable.logo,
            metadata: organizationsTable.metadata,
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
        .where(eq(membersTable.userId, user.id));

      // Check if any organization has projects
      for (const membership of userMemberships) {
        const projects = await db
          .select()
          .from(projectsTable)
          .where(
            eq(
              projectsTable.organizationId,
              membership.organizationId
            )
          )
          .limit(1);

        if (projects.length > 0) {
          return {
            success: true,
            organization: membership.organization,
            project: projects[0],
          };
        }
      }

      // If user has organizations but no projects
      if (userMemberships.length > 0) {
        return {
          success: true,
          organization: userMemberships[0]?.organization,
        };
      }

      // Check for pending invitations
      const pendingInvitations = await db
        .select()
        .from(invitationsTable)
        .where(
          and(
            eq(invitationsTable.email, user.email),
            eq(invitationsTable.status, "pending"),
            gt(invitationsTable.expiresAt, new Date())
          )
        )
        .limit(1);

      // Return user state without creating an organization
      return {
        success: true,
        organization: null,
        hasPendingInvitations:
          pendingInvitations.length > 0,
      };
    }
  ),
} satisfies TRPCRouterRecord;
