import { db } from "@/infrastructure/db";
import { env as serverEnv } from "@/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import {
  usersTable,
  sessionsTable,
  accountsTable,
  verificationsTable,
  organizationsTable,
  membersTable,
  invitationsTable,
} from "@map-poster/db";
import { eq, and } from "drizzle-orm";

export const auth = betterAuth({
  baseURL: serverEnv.BETTER_AUTH_URL,
  secret: serverEnv.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: usersTable,
      session: sessionsTable,
      account: accountsTable,
      verification: verificationsTable,
      organization: organizationsTable,
      member: membersTable,
      invitation: invitationsTable,
    },
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes cache to reduce database hits
    },
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Detect placeholder user merge on OAuth callbacks or social sign-in
      if (
        ctx.path.startsWith("/callback") ||
        ctx.path === "/sign-in/social"
      ) {
        const email =
          (ctx.body?.["email"] as string | undefined) ||
          (ctx.query?.["email"] as string | undefined);

        if (email) {
          // Find an existing placeholder user by email
          const [placeholder] = await db
            .select()
            .from(usersTable)
            .where(
              and(
                eq(usersTable.email, email),
                eq(usersTable.emailVerified, false)
              )
            )
            .limit(1);

          if (placeholder) {
            // Modify context so Better Auth updates existing user instead of creating a new one
            return {
              context: {
                ...ctx,
                body: {
                  ...ctx.body,
                  // Use existing user ID
                  userId: placeholder.id,
                  // Mark email as verified
                  emailVerified: true,
                  // Update user profile from OAuth payload while preserving existing values
                  name:
                    (ctx.body?.["name"] as
                      | string
                      | undefined) || placeholder.name,
                  image:
                    (ctx.body?.["image"] as
                      | string
                      | undefined) || placeholder.image,
                },
              },
            };
          }
        }
      }
    }),
  },
  socialProviders: {},
  emailAndPassword: {
    enabled: true,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  plugins: [
    admin(),
    organization({
      sendInvitationEmail: async () => {
        return;
      },
    }),
  ],
});
