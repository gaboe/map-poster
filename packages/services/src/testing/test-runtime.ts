/**
 * Test runtime factory for Effect services.
 *
 * Creates an Effect ManagedRuntime configured with a test database,
 * allowing integration tests to use Effect services with PGlite.
 *
 * Usage in tests:
 * ```typescript
 * import { createTestRuntime } from "@map-poster/services/testing";
 *
 * const testRuntime = createTestRuntime(pgliteDb);
 * const caller = createTestCaller({ db, effectRuntime: testRuntime });
 * ```
 */
import { Layer, ManagedRuntime } from "effect";
import type { Db } from "@map-poster/db";
import type { TestDb } from "@map-poster/db/testing";
import { Database } from "../context/database";
import { DatabaseHealthServiceLayer } from "../health/database-health";
import { HealthCheckServiceLayer } from "../health/health-check";

/**
 * Creates an Effect runtime configured with the provided test database.
 *
 * This allows Effect services (like DatabaseHealthService) to use the same
 * PGlite database as the TRPC test context, ensuring data consistency.
 */
export function createTestRuntime(db: TestDb) {
  // Create Database layer with test db
  // Cast required: PGlite and node-postgres have compatible Drizzle APIs
  const TestDatabaseLayer = Layer.succeed(
    Database,
    db as unknown as Db
  );

  // Compose DatabaseHealthService with test database
  const TestDatabaseHealthServiceLayer =
    DatabaseHealthServiceLayer.pipe(
      Layer.provide(TestDatabaseLayer)
    );

  // Full test layer
  const TestAppLayer = Layer.mergeAll(
    TestDatabaseLayer,
    HealthCheckServiceLayer,
    TestDatabaseHealthServiceLayer
  );

  return ManagedRuntime.make(TestAppLayer);
}

/**
 * Type of the test runtime returned by createTestRuntime
 */
export type TestRuntime = ReturnType<
  typeof createTestRuntime
>;
