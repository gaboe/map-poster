/**
 * Effect ManagedRuntime for the application.
 *
 * This creates a global runtime with all Effect services pre-configured,
 * following the official Effect pattern for framework integration.
 *
 * Usage in TRPC handlers:
 * ```ts
 * import { runtime } from "@/infrastructure/effect-runtime"
 *
 * const result = await runtime.runPromise(
 *   Effect.gen(function* () {
 *     const dbHealth = yield* DatabaseHealthService
 *     return yield* dbHealth.checkConnection()
 *   })
 * )
 * ```
 */
import { Layer, ManagedRuntime } from "effect";
import {
  Database,
  DatabaseHealthServiceLayer,
  HealthCheckServiceLayer,
} from "@map-poster/services";
import { db } from "./db";

// =============================================================================
// Layers
// =============================================================================

/**
 * Database layer - uses the existing global db connection
 */
const DatabaseLive = Layer.succeed(Database, db);

/**
 * Database health service layer with database dependency
 */
const DatabaseHealthServiceLive =
  DatabaseHealthServiceLayer.pipe(
    Layer.provide(DatabaseLive)
  );

/**
 * Full application layer combining all services
 */
const AppLayer = Layer.mergeAll(
  DatabaseLive,
  HealthCheckServiceLayer,
  DatabaseHealthServiceLive
);

// =============================================================================
// Runtime
// =============================================================================

/**
 * Global ManagedRuntime for the application.
 *
 * This runtime is created once at app startup and provides all Effect services.
 * Use `runtime.runPromise()` or `runtime.runSync()` to execute effects.
 *
 * Remember to call `runtime.dispose()` on server shutdown.
 */
export const runtime = ManagedRuntime.make(AppLayer);

/**
 * Type helper for the runtime context
 */
export type AppContext =
  ManagedRuntime.ManagedRuntime.Context<typeof runtime>;

/**
 * Type for the Effect runtime (production or test)
 */
export type EffectRuntime = typeof runtime;

// =============================================================================
// Graceful Shutdown
// =============================================================================

/**
 * Dispose the runtime and clean up all resources.
 * Call this on server shutdown (SIGTERM handler).
 */
export const disposeRuntime = async () => {
  await runtime.dispose();
};
