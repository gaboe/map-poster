/**
 * Database health check service.
 *
 * Demonstrates the Effect pattern for services that depend on Database:
 * - Uses `yield* Database` to get the db instance
 * - Uses `Layer.effect` because it needs to access context
 * - Must be provided with DatabaseLive layer in runtime
 *
 * Usage:
 * ```ts
 * const result = await runtime.runPromise(
 *   Effect.gen(function* () {
 *     const dbHealth = yield* DatabaseHealthService;
 *     return yield* dbHealth.checkConnection();
 *   })
 * );
 * ```
 */
import { Context, Effect, Layer, Schema } from "effect";
import { sql } from "drizzle-orm";
import { Database } from "../context/database";

// =============================================================================
// Models
// =============================================================================

export type DatabaseHealthResult = {
  readonly status: "connected" | "error";
  readonly latencyMs: number;
  readonly error?: string;
};

// =============================================================================
// Errors
// =============================================================================

export class DatabaseHealthError extends Schema.TaggedError<DatabaseHealthError>()(
  "DatabaseHealthError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Defect),
  }
) {}

// =============================================================================
// Service
// =============================================================================

export class DatabaseHealthService extends Context.Tag(
  "@map-poster/DatabaseHealthService"
)<
  DatabaseHealthService,
  {
    /**
     * Check database connectivity by executing a simple query.
     * Returns connection status and latency.
     */
    readonly checkConnection: () => Effect.Effect<
      DatabaseHealthResult,
      DatabaseHealthError
    >;
  }
>() {
  /**
   * Live implementation - requires Database dependency
   *
   * This demonstrates the Layer.effect pattern where we need
   * to access another service (Database) during layer construction.
   */
  static readonly layer = Layer.effect(
    DatabaseHealthService,
    Effect.gen(function* () {
      // Get database from context - this is the key pattern!
      const db = yield* Database;

      // Inner implementation with tracing via Effect.fn
      const checkConnectionImpl = Effect.fn(
        "DatabaseHealth.checkConnection"
      )(function* () {
        const startTime = Date.now();

        yield* Effect.tryPromise({
          try: async () => {
            await db.execute(sql`SELECT 1`);
          },
          catch: (error) =>
            new DatabaseHealthError({
              message: `Database connection failed: ${
                error instanceof Error
                  ? error.message
                  : String(error)
              }`,
              cause: error,
            }),
        });

        const latencyMs = Date.now() - startTime;

        return {
          status: "connected",
          latencyMs,
        } satisfies DatabaseHealthResult;
      });

      // Wrap with error recovery
      const checkConnection = () =>
        checkConnectionImpl().pipe(
          Effect.catchAll((error: DatabaseHealthError) =>
            Effect.succeed({
              status: "error",
              latencyMs: 0,
              error: error.message,
            } satisfies DatabaseHealthResult)
          )
        );

      return { checkConnection };
    })
  );
}

export const DatabaseHealthServiceLayer =
  DatabaseHealthService.layer;
