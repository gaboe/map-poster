/**
 * Test setup for integration tests using PGlite (in-memory PostgreSQL)
 *
 * PGlite is PostgreSQL compiled to WebAssembly, providing a real PostgreSQL
 * environment without external dependencies. This enables true integration
 * testing of SQL queries including CTEs, window functions, and complex joins.
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../schema";

export type TestDb = ReturnType<
  typeof drizzle<typeof schema>
>;

// Get the directory of this file (dirname/resolve from node:path OK per CLAUDE.md)
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Creates an in-memory PostgreSQL database with all migrations applied.
 * Each call creates a fresh, isolated database instance.
 */
export async function createTestDb(): Promise<{
  db: TestDb;
  client: PGlite;
}> {
  const client = new PGlite();

  // Wait for PGlite WASM to be fully initialized
  await client.waitReady;

  const db = drizzle(client, { schema });

  // Apply all migrations in order
  await applyMigrations(client);

  return { db, client };
}

/**
 * Applies all SQL migrations to the database.
 * Migrations are read from the drizzle folder and executed in order.
 */
async function applyMigrations(
  client: PGlite
): Promise<void> {
  const migrationsDir = resolve(__dirname, "../../drizzle");

  // Read all migration files using Bun.Glob
  const files = await getMigrationFiles(migrationsDir);

  // Execute each migration in order
  for (const file of files) {
    const filePath = resolve(migrationsDir, file);
    const sql = await Bun.file(filePath).text();
    await client.exec(sql);
  }
}

/**
 * Gets migration files sorted in the correct order (0000, 0001, etc.)
 */
async function getMigrationFiles(
  dir: string
): Promise<string[]> {
  const glob = new Bun.Glob("*.sql");
  const files = await Array.fromAsync(
    glob.scan({ cwd: dir })
  );

  return files.sort((a, b) => {
    // Extract the number prefix (e.g., "0000" from "0000_zippy_roland.sql")
    const numA = parseInt(a.split("_")[0] ?? "0", 10);
    const numB = parseInt(b.split("_")[0] ?? "0", 10);
    return numA - numB;
  });
}

/**
 * Cleans up the test database.
 * Call this in afterEach/afterAll to release resources.
 */
export async function cleanupTestDb(
  client: PGlite | undefined
): Promise<void> {
  if (client) {
    await client.close();
  }
}
