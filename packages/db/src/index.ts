import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export * from "./schema";

// Note: Queries are exported separately via "@map-poster/db/queries"
// to avoid circular type dependencies. See package.json exports.

/**
 * Creates a database connection using a connection pool
 * This is the recommended way to connect to the database in production
 */
export function connectDb(connectionString: string) {
  const pool = new Pool({
    connectionString,
    min: 2, // minimum number of clients in the pool
    max: 20, // maximum number of clients in the pool (shared DB with test+prod)
    idleTimeoutMillis: 30000, // close idle clients after 30 seconds
    connectionTimeoutMillis: 5000, // return error after 5 seconds if connection could not be established
  });

  return drizzle(pool, { schema });
}

/**
 * Database connection type using connection pool
 * This is the standard type used across the application
 */
export type Db = ReturnType<typeof connectDb>;
