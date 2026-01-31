import * as Sentry from "@sentry/tanstackstart-react";

/**
 * Generic type for any Drizzle query that has a toSQL method
 */
type DrizzleQuery = {
  toSQL?: () => { sql: string };
  then?: (
    resolve: (value: unknown) => void,
    reject: (error: unknown) => void
  ) => void;
};

/**
 * Wrapper for Drizzle queries that adds Sentry tracing
 *
 * Usage:
 * ```ts
 * const users = await traced(
 *   db.select().from(usersTable).where(eq(usersTable.id, userId))
 * );
 * ```
 */
export async function traced<T>(
  query: DrizzleQuery,
  operationName?: string
): Promise<T> {
  // Try to extract SQL if available
  let sqlString = operationName || "db.query";

  try {
    if (
      "toSQL" in query &&
      typeof query.toSQL === "function"
    ) {
      const sqlObj = query.toSQL();
      sqlString = sqlObj.sql;
    }
  } catch {
    // If toSQL fails, use default name
  }

  return Sentry.startSpan(
    {
      op: "db.query",
      name: sqlString,
      attributes: {
        "db.system": "postgresql",
      },
    },
    () => {
      // Execute the query
      if (typeof query === "object" && query !== null) {
        return query as Promise<T>;
      }
      throw new Error(
        "Invalid query type passed to traced()"
      );
    }
  );
}

/**
 * Higher-order function that wraps a database operation with tracing
 * Useful for wrapping entire functions that perform DB operations
 *
 * Usage:
 * ```ts
 * const getUser = withDbTracing("getUser", async (userId: string) => {
 *   return db.select().from(usersTable).where(eq(usersTable.id, userId));
 * });
 * ```
 */
export function withDbTracing<
  TArgs extends unknown[],
  TResult,
>(
  operationName: string,
  fn: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    return Sentry.startSpan(
      {
        op: "db.operation",
        name: operationName,
        attributes: {
          "db.system": "postgresql",
        },
      },
      () => fn(...args)
    );
  };
}
