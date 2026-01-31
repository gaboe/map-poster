/**
 * Example integration test demonstrating PGlite + TRPC testing pattern.
 *
 * This test shows how to:
 * 1. Create an isolated in-memory PostgreSQL database per test
 * 2. Seed test data using composable seed utilities
 * 3. Call TRPC procedures directly without HTTP layer
 * 4. Assert on real database queries with full SQL support
 */

import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
} from "vitest";
import {
  createTestDb,
  cleanupTestDb,
  type TestDb,
} from "@map-poster/db/testing";
import {
  seedUser,
  seedOrganization,
  seedMember,
  seedProject,
  seedCompleteScenario,
} from "@map-poster/db/testing/seed";
import { organizationsTable } from "@map-poster/db";
import {
  createLatestProjectSubquery,
  createMemberCountSubquery,
} from "@map-poster/db/queries";
import { sql } from "drizzle-orm";
import { createTestCaller } from "./trpc-test-utils";

describe("Example Integration Tests", () => {
  let db: TestDb;
  let client:
    | Awaited<ReturnType<typeof createTestDb>>["client"]
    | undefined;

  beforeEach(async () => {
    const testDb = await createTestDb();
    db = testDb.db;
    client = testDb.client;
  });

  afterEach(async () => {
    await cleanupTestDb(client);
  });

  describe("Seed utilities", () => {
    it("creates a user with default values", async () => {
      const user = await seedUser(db);

      expect(user.id).toBeDefined();
      expect(user.name).toBe("Test User");
      expect(user.email).toContain("@example.com");
      expect(user.emailVerified).toBe(true);
    });

    it("creates a user with custom values", async () => {
      const user = await seedUser(db, {
        name: "John Doe",
        email: "john@example.com",
      });

      expect(user.name).toBe("John Doe");
      expect(user.email).toBe("john@example.com");
    });

    it("creates organization with member", async () => {
      const user = await seedUser(db);
      const org = await seedOrganization(db, {
        name: "Acme Corp",
      });
      const member = await seedMember(db, {
        userId: user.id,
        organizationId: org.id,
        role: "owner",
      });

      expect(org.name).toBe("Acme Corp");
      expect(member.role).toBe("owner");
      expect(member.userId).toBe(user.id);
      expect(member.organizationId).toBe(org.id);
    });

    it("creates complete scenario with user, org, and project", async () => {
      const scenario = await seedCompleteScenario(db);

      expect(scenario.user.id).toBeDefined();
      expect(scenario.org.id).toBeDefined();
      expect(scenario.project.id).toBeDefined();
      expect(scenario.project.organizationId).toBe(
        scenario.org.id
      );
    });
  });

  describe("TRPC Endpoints - User", () => {
    it("user.getInfo returns null for unauthenticated user", async () => {
      const caller = createTestCaller({ db });

      const result = await caller.user.getInfo();

      expect(result).toBeNull();
    });

    it("user.getOnboardingStatus returns organization and project for complete setup", async () => {
      // Setup: user with org and project
      const scenario = await seedCompleteScenario(db);
      const caller = createTestCaller({
        db,
        userId: scenario.user.id,
      });

      const result =
        await caller.user.getOnboardingStatus();

      expect(result.success).toBe(true);
      expect(result.organization).toBeDefined();
      expect(result.organization?.id).toBe(scenario.org.id);
      expect(result.project).toBeDefined();
      expect(result.project?.id).toBe(scenario.project.id);
    });

    it("user.getOnboardingStatus returns org without project for partial setup", async () => {
      // Setup: user with org but NO project
      const user = await seedUser(db);
      const org = await seedOrganization(db);
      await seedMember(db, {
        userId: user.id,
        organizationId: org.id,
        role: "owner",
      });

      const caller = createTestCaller({
        db,
        userId: user.id,
      });

      const result =
        await caller.user.getOnboardingStatus();

      expect(result.success).toBe(true);
      expect(result.organization).toBeDefined();
      expect(result.organization?.id).toBe(org.id);
      expect(result.project).toBeUndefined();
    });

    it("user.getOnboardingStatus returns null org for new user", async () => {
      // Setup: user without any org
      const user = await seedUser(db);
      const caller = createTestCaller({
        db,
        userId: user.id,
      });

      const result =
        await caller.user.getOnboardingStatus();

      expect(result.success).toBe(true);
      expect(result.organization).toBeNull();
    });
  });

  describe("TRPC Endpoints - Organization", () => {
    it("organization.getUserOrganizations returns empty array for user without orgs", async () => {
      const user = await seedUser(db);
      const caller = createTestCaller({
        db,
        userId: user.id,
      });

      const result =
        await caller.organization.getUserOrganizations();

      expect(result).toEqual([]);
    });

    it("organization.getUserOrganizations returns all user organizations", async () => {
      const user = await seedUser(db);
      const org1 = await seedOrganization(db, {
        name: "Org 1",
      });
      const org2 = await seedOrganization(db, {
        name: "Org 2",
      });
      await seedMember(db, {
        userId: user.id,
        organizationId: org1.id,
        role: "owner",
      });
      await seedMember(db, {
        userId: user.id,
        organizationId: org2.id,
        role: "member",
      });

      const caller = createTestCaller({
        db,
        userId: user.id,
      });

      const result =
        await caller.organization.getUserOrganizations();

      expect(result).toHaveLength(2);
      expect(
        result.map((o: { name: string }) => o.name).sort()
      ).toEqual(["Org 1", "Org 2"]);
    });

    it("organization.getOrganizationsDetails returns orgs with projects", async () => {
      // Setup: user with org and 2 projects
      const user = await seedUser(db);
      const org = await seedOrganization(db, {
        name: "Acme Corp",
      });
      await seedMember(db, {
        userId: user.id,
        organizationId: org.id,
        role: "owner",
      });
      await seedProject(db, {
        organizationId: org.id,
        name: "Project Alpha",
      });
      await seedProject(db, {
        organizationId: org.id,
        name: "Project Beta",
      });

      const caller = createTestCaller({
        db,
        userId: user.id,
      });

      const result =
        await caller.organization.getOrganizationsDetails();

      expect(result).toHaveLength(1);
      expect(result[0]?.organization.name).toBe(
        "Acme Corp"
      );
      expect(result[0]?.userRole).toBe("owner");
      expect(result[0]?.projects).toHaveLength(2);
      expect(
        result[0]?.projects
          .map((p: { name: string }) => p.name)
          .sort()
      ).toEqual(["Project Alpha", "Project Beta"]);
    });

    it("organization.createOrganization creates org and adds user as owner", async () => {
      const user = await seedUser(db);
      const caller = createTestCaller({
        db,
        userId: user.id,
      });

      const result =
        await caller.organization.createOrganization({
          name: "New Organization",
        });

      expect(result.organization).toBeDefined();
      expect(result.organization?.name).toBe(
        "New Organization"
      );

      // Verify user is owner
      const orgs =
        await caller.organization.getUserOrganizations();
      expect(orgs).toHaveLength(1);
      expect(orgs[0]?.id).toBe(result.organization?.id);
    });

    it("organization.getById returns organization details", async () => {
      const scenario = await seedCompleteScenario(db);
      const caller = createTestCaller({
        db,
        userId: scenario.user.id,
      });

      const result = await caller.organization.getById({
        id: scenario.org.id,
      });

      expect(result.organization).toBeDefined();
      expect(result.organization?.id).toBe(scenario.org.id);
      expect(result.organization?.name).toBe(
        scenario.org.name
      );
    });

    it("organization.getById throws for non-member user", async () => {
      const user = await seedUser(db);
      const org = await seedOrganization(db);
      // User is NOT a member of org

      const caller = createTestCaller({
        db,
        userId: user.id,
      });

      await expect(
        caller.organization.getById({ id: org.id })
      ).rejects.toThrow("access denied");
    });

    it("organization.getOrganizationDetail returns members and projects", async () => {
      // Setup: org with 2 members and 1 project
      const owner = await seedUser(db, { name: "Owner" });
      const member = await seedUser(db, { name: "Member" });
      const org = await seedOrganization(db);
      await seedMember(db, {
        userId: owner.id,
        organizationId: org.id,
        role: "owner",
      });
      await seedMember(db, {
        userId: member.id,
        organizationId: org.id,
        role: "member",
      });
      await seedProject(db, {
        organizationId: org.id,
        name: "Main Project",
      });

      const caller = createTestCaller({
        db,
        userId: owner.id,
      });

      const result =
        await caller.organization.getOrganizationDetail({
          organizationId: org.id,
        });

      expect(result.organization.id).toBe(org.id);
      expect(result.members).toHaveLength(2);
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0]?.name).toBe("Main Project");
    });
  });

  describe("TRPC Endpoints - Project", () => {
    it("project.createProject creates project in organization", async () => {
      const user = await seedUser(db);
      const org = await seedOrganization(db);
      await seedMember(db, {
        userId: user.id,
        organizationId: org.id,
        role: "owner",
      });

      const caller = createTestCaller({
        db,
        userId: user.id,
      });

      const result = await caller.project.createProject({
        organizationId: org.id,
        name: "New Project",
      });

      expect(result.project).toBeDefined();
      expect(result.project?.name).toBe("New Project");
      expect(result.project?.organizationId).toBe(org.id);
    });

    it("project.createProject throws for non-member", async () => {
      const user = await seedUser(db);
      const org = await seedOrganization(db);
      // User is NOT a member

      const caller = createTestCaller({
        db,
        userId: user.id,
      });

      await expect(
        caller.project.createProject({
          organizationId: org.id,
          name: "Unauthorized Project",
        })
      ).rejects.toThrow("not a member");
    });
  });

  describe("Database isolation", () => {
    it("isolates data between test runs", async () => {
      // This test runs in a fresh database
      // No data from previous tests should exist
      const user = await seedUser(db);
      const caller = createTestCaller({
        db,
        userId: user.id,
      });

      // Should have no organizations (fresh DB)
      const orgs =
        await caller.organization.getUserOrganizations();
      expect(orgs).toHaveLength(0);
    });
  });

  describe("Reusable Subqueries", () => {
    it("createLatestProjectSubquery returns latest project per organization", async () => {
      // Setup: 2 orgs, each with multiple projects
      const org1 = await seedOrganization(db, {
        name: "Org 1",
      });
      const org2 = await seedOrganization(db, {
        name: "Org 2",
      });

      // Org1 projects (older first)
      await seedProject(db, {
        organizationId: org1.id,
        name: "Org1 - Old Project",
      });
      const org1Latest = await seedProject(db, {
        organizationId: org1.id,
        name: "Org1 - Latest Project",
      });

      // Org2 projects
      await seedProject(db, {
        organizationId: org2.id,
        name: "Org2 - Old Project",
      });
      const org2Latest = await seedProject(db, {
        organizationId: org2.id,
        name: "Org2 - Latest Project",
      });

      // Use the subquery with LATERAL join
      const latestProjectSq =
        createLatestProjectSubquery(db);

      const result = await db
        .select({
          orgId: organizationsTable.id,
          orgName: organizationsTable.name,
          latestProjectId: latestProjectSq.id,
          latestProjectName: latestProjectSq.name,
        })
        .from(organizationsTable)
        .leftJoinLateral(latestProjectSq, sql`true`)
        .orderBy(organizationsTable.name);

      expect(result).toHaveLength(2);

      // Org 1 should have its latest project
      expect(result[0]?.orgName).toBe("Org 1");
      expect(result[0]?.latestProjectId).toBe(
        org1Latest.id
      );
      expect(result[0]?.latestProjectName).toBe(
        "Org1 - Latest Project"
      );

      // Org 2 should have its latest project
      expect(result[1]?.orgName).toBe("Org 2");
      expect(result[1]?.latestProjectId).toBe(
        org2Latest.id
      );
      expect(result[1]?.latestProjectName).toBe(
        "Org2 - Latest Project"
      );
    });

    it("createLatestProjectSubquery returns null for org without projects", async () => {
      const orgWithProjects = await seedOrganization(db, {
        name: "Has Projects",
      });
      await seedOrganization(db, {
        name: "No Projects",
      });

      await seedProject(db, {
        organizationId: orgWithProjects.id,
        name: "Some Project",
      });

      const latestProjectSq =
        createLatestProjectSubquery(db);

      const result = await db
        .select({
          orgName: organizationsTable.name,
          latestProjectName: latestProjectSq.name,
        })
        .from(organizationsTable)
        .leftJoinLateral(latestProjectSq, sql`true`)
        .orderBy(organizationsTable.name);

      expect(result).toHaveLength(2);
      expect(result[0]?.orgName).toBe("Has Projects");
      expect(result[0]?.latestProjectName).toBe(
        "Some Project"
      );
      expect(result[1]?.orgName).toBe("No Projects");
      expect(result[1]?.latestProjectName).toBeNull();
    });

    it("createMemberCountSubquery counts members per organization", async () => {
      const org1 = await seedOrganization(db, {
        name: "Big Org",
      });
      const org2 = await seedOrganization(db, {
        name: "Small Org",
      });

      // Big org has 3 members
      const user1 = await seedUser(db);
      const user2 = await seedUser(db);
      const user3 = await seedUser(db);
      await seedMember(db, {
        userId: user1.id,
        organizationId: org1.id,
        role: "owner",
      });
      await seedMember(db, {
        userId: user2.id,
        organizationId: org1.id,
        role: "admin",
      });
      await seedMember(db, {
        userId: user3.id,
        organizationId: org1.id,
        role: "member",
      });

      // Small org has 1 member
      const user4 = await seedUser(db);
      await seedMember(db, {
        userId: user4.id,
        organizationId: org2.id,
        role: "owner",
      });

      const memberCountSq = createMemberCountSubquery(db);

      const result = await db
        .select({
          orgName: organizationsTable.name,
          memberCount: memberCountSq.count,
        })
        .from(organizationsTable)
        .leftJoinLateral(memberCountSq, sql`true`)
        .orderBy(organizationsTable.name);

      expect(result).toHaveLength(2);
      expect(result[0]?.orgName).toBe("Big Org");
      expect(result[0]?.memberCount).toBe(3);
      expect(result[1]?.orgName).toBe("Small Org");
      expect(result[1]?.memberCount).toBe(1);
    });
  });
});
