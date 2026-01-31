#!/usr/bin/env bun

/**
 * Database migration job
 *
 * Runs database migrations using Drizzle ORM
 */

import { migrate } from "drizzle-orm/node-postgres/migrator";
import { connectDb } from "@map-poster/db";
import { env } from "./env";

export async function dbMigrate() {
  console.log(
    "🗃️ [DB-MIGRATE] Starting database migration"
  );

  // Database setup using connectDb from @map-poster/db
  const db = connectDb(env.DATABASE_URL);

  try {
    console.log("🔄 [DB-MIGRATE] Running migrations...");

    // Run migrations from the db package
    await migrate(db, {
      migrationsFolder: "../../packages/db/drizzle",
    });

    console.log(
      "✅ [DB-MIGRATE] Database migration completed successfully"
    );
  } catch (error) {
    console.error(
      "❌ [DB-MIGRATE] Database migration failed:",
      error
    );
    throw error;
  } finally {
    // Connection cleanup handled by connectDb
  }
}

// Run if this script is executed directly
if (import.meta.main) {
  void dbMigrate();
}
