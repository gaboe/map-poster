import * as Sentry from "@sentry/tanstackstart-react";
import type { Db } from "@map-poster/db";

/**
 * Creates a traced database wrapper that automatically adds Sentry spans
 * to all database queries executed through it.
 *
 * This wrapper intercepts select, insert, update, and delete operations
 * and wraps them with Sentry tracing spans that capture SQL query details.
 */
export function createTracedDb(db: Db): Db {
  return new Proxy(db, {
    get(target, prop) {
      const originalMethod = target[prop as keyof Db];

      // Only intercept query methods
      if (
        typeof originalMethod === "function" &&
        ["select", "insert", "update", "delete"].includes(
          String(prop)
        )
      ) {
        return function (...args: unknown[]) {
          // Call original method to get query builder, bind to target
          const queryBuilder = (
            originalMethod as (
              ...args: unknown[]
            ) => unknown
          ).call(target, ...args);

          // Wrap the entire query builder chain
          return createTracedQueryBuilder(
            queryBuilder,
            String(prop)
          );
        };
      }

      return originalMethod;
    },
  }) as Db;
}

/**
 * Wraps a Drizzle query builder to trace the final query execution
 */
function createTracedQueryBuilder<T>(
  queryBuilder: T,
  operation: string
): T {
  return new Proxy(queryBuilder as object, {
    get(target, prop) {
      const originalMethod = (
        target as Record<string, unknown>
      )[String(prop)];

      if (typeof originalMethod !== "function") {
        return originalMethod;
      }

      // Check if this is a terminal method that executes the query
      const terminalMethods = [
        "then",
        "execute",
        "all",
        "get",
        "run",
        "values",
      ];
      const isTerminal = terminalMethods.includes(
        String(prop)
      );

      return function (this: unknown, ...args: unknown[]) {
        // Preserve this context for method chaining
        const result = (
          originalMethod as (...args: unknown[]) => unknown
        ).apply(this ?? target, args);

        // If this is a terminal method, wrap with Sentry span
        if (
          isTerminal &&
          result &&
          typeof result === "object" &&
          "then" in result
        ) {
          return traceQuery(
            result as Promise<unknown>,
            this ?? target,
            operation
          );
        }

        // Otherwise, continue wrapping the builder chain
        if (result && typeof result === "object") {
          return createTracedQueryBuilder(
            result,
            operation
          );
        }

        return result;
      };
    },
  }) as T;
}

/**
 * Wraps query execution with Sentry tracing
 */
async function traceQuery<T>(
  queryPromise: Promise<T>,
  queryBuilder: object,
  operation: string
): Promise<T> {
  let sqlString = `db.${operation}`;

  // Try to extract SQL if available
  try {
    if (
      "toSQL" in queryBuilder &&
      typeof queryBuilder.toSQL === "function"
    ) {
      const sqlObj = queryBuilder.toSQL() as {
        sql: string;
      };
      sqlString = sqlObj.sql;
    }
  } catch {
    // If toSQL fails, use operation name
  }

  return Sentry.startSpan(
    {
      op: "db.query",
      name: sqlString,
      attributes: {
        "db.system": "postgresql",
        "db.operation": operation,
      },
    },
    () => queryPromise
  );
}
