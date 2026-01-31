/**
 * Seed utilities for integration tests.
 *
 * These functions create test data in a predictable, composable way.
 * Each function returns the created record(s) for use in test assertions.
 */

import { createId } from "@paralleldrive/cuid2";
import type {
  MemberId,
  OrganizationId,
  ProjectId,
  UserId,
} from "@map-poster/common";
import {
  usersTable,
  organizationsTable,
  membersTable,
  projectsTable,
} from "../schema";
import type { TestDb } from "./setup";

// =============================================================================
// User Seed
// =============================================================================

type CreateUserOptions = {
  name?: string;
  email?: string;
};

export async function seedUser(
  db: TestDb,
  options: CreateUserOptions = {}
): Promise<typeof usersTable.$inferSelect> {
  const id = createId() as UserId;
  const [user] = await db
    .insert(usersTable)
    .values({
      id,
      name: options.name ?? "Test User",
      email: options.email ?? `test-${id}@example.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  if (!user) throw new Error("Failed to create user");
  return user;
}

// =============================================================================
// Organization Seed
// =============================================================================

type CreateOrganizationOptions = {
  name?: string;
  slug?: string;
};

export async function seedOrganization(
  db: TestDb,
  options: CreateOrganizationOptions = {}
): Promise<typeof organizationsTable.$inferSelect> {
  const id = createId() as OrganizationId;
  const [org] = await db
    .insert(organizationsTable)
    .values({
      id,
      name: options.name ?? "Test Organization",
      slug: options.slug ?? `test-org-${id}`,
      createdAt: new Date(),
    })
    .returning();

  if (!org)
    throw new Error("Failed to create organization");
  return org;
}

// =============================================================================
// Member Seed (links user to organization)
// =============================================================================

type CreateMemberOptions = {
  userId: UserId;
  organizationId: OrganizationId;
  role?: "owner" | "admin" | "member";
};

export async function seedMember(
  db: TestDb,
  options: CreateMemberOptions
): Promise<typeof membersTable.$inferSelect> {
  const [member] = await db
    .insert(membersTable)
    .values({
      id: createId() as MemberId,
      userId: options.userId,
      organizationId: options.organizationId,
      role: options.role ?? "member",
      createdAt: new Date(),
    })
    .returning();

  if (!member) throw new Error("Failed to create member");
  return member;
}

// =============================================================================
// Project Seed
// =============================================================================

type CreateProjectOptions = {
  organizationId: OrganizationId;
  name?: string;
};

export async function seedProject(
  db: TestDb,
  options: CreateProjectOptions
): Promise<typeof projectsTable.$inferSelect> {
  const id = createId() as ProjectId;
  const [project] = await db
    .insert(projectsTable)
    .values({
      id,
      name: options.name ?? "Test Project",
      organizationId: options.organizationId,
      createdAt: new Date(),
    })
    .returning();

  if (!project) throw new Error("Failed to create project");
  return project;
}

// =============================================================================
// Composite Seed Helpers
// =============================================================================

/**
 * Creates a complete test scenario with user, org, and project.
 * Useful for testing queries that span multiple tables.
 */
export async function seedCompleteScenario(db: TestDb) {
  const user = await seedUser(db);
  const org = await seedOrganization(db);
  await seedMember(db, {
    userId: user.id,
    organizationId: org.id,
    role: "owner",
  });
  const project = await seedProject(db, {
    organizationId: org.id,
  });

  return {
    user,
    org,
    project,
  };
}
