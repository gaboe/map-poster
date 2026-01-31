/**
 * TRPC test utilities for integration testing.
 *
 * Creates a TRPC caller that can be used to call procedures directly
 * without HTTP layer, using a test database.
 *
 * Usage:
 *   const caller = createTestCaller({ db, userId: user.id });
 *   const result = await caller.organization.getById({ id: orgId });
 */

import { createCallerFactory } from "@/infrastructure/trpc/init";
import { appRouter } from "@/infrastructure/trpc/router";
import type { TestDb } from "@map-poster/db/testing";
import type { UserId } from "@map-poster/common";
import {
  createTestRuntime,
  type TestRuntime,
} from "@map-poster/services/testing";

// Create the caller factory for the app router
const createCaller = createCallerFactory(appRouter);

type CreateTestCallerOptions = {
  /** Test database instance from PGlite */
  db: TestDb;
  /** Optional pre-created Effect runtime (creates one if not provided) */
  effectRuntime?: TestRuntime;
  /** User role for the mock session (defaults to "user") */
  role?: "user" | "admin";
  /** User ID for authenticated procedures (optional) */
  userId?: UserId;
};

/**
 * Creates a TRPC caller for integration testing.
 *
 * The caller can be used to call any TRPC procedure directly,
 * bypassing HTTP but still running through all middlewares.
 */
export function createTestCaller(
  options: CreateTestCallerOptions
) {
  // Create mock session if userId provided
  const now = new Date();
  const session = options.userId
    ? {
        user: {
          id: options.userId as string,
          email: "test@example.com",
          name: "Test User",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
          banned: null,
          banExpires: null,
          banReason: null,
          image: null,
          role: options.role ?? "user",
        },
        session: {
          id: "test-session-id",
          userId: options.userId as string,
          expiresAt: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ),
          createdAt: now,
          updatedAt: now,
          token: "test-token",
          ipAddress: null,
          userAgent: null,
          impersonatedBy: null,
          activeOrganizationId: null,
        },
      }
    : null;

  // Create or use provided Effect runtime
  const effectRuntime =
    options.effectRuntime ?? createTestRuntime(options.db);

  // Cast required: PGlite and node-postgres have different TS types but identical
  // Drizzle query API at runtime. This is verified by our integration tests.
  return createCaller({
    db: options.db as unknown,
    effectRuntime,
    headers: new Headers(),
    session,
  } as Parameters<typeof createCaller>[0]);
}

/** Type of the test caller */
export type TestCaller = ReturnType<
  typeof createTestCaller
>;
