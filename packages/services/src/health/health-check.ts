import {
  Context,
  Effect,
  Layer,
  Schedule,
  Schema,
} from "effect";

// =============================================================================
// Models
// =============================================================================

export type HealthCheckOptions = {
  readonly maxRetries?: number;
  readonly retryDelay?: number;
};

export type HealthCheckResult = {
  readonly success: boolean;
  readonly attempts: number;
  readonly lastError?: unknown;
};

// =============================================================================
// Errors
// =============================================================================

/**
 * Health check error - endpoint not ready after retries
 */
export class HealthCheckError extends Schema.TaggedError<HealthCheckError>()(
  "HealthCheckError",
  {
    baseUrl: Schema.String,
    message: Schema.String,
    attempts: Schema.Number,
    cause: Schema.optional(Schema.Defect),
  }
) {}

// =============================================================================
// Service
// =============================================================================

const checkOnce = (baseUrl: string, attempt: number) =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(
        `${baseUrl}/healthz/ready`,
        {
          method: "GET",
          headers: {
            "User-Agent": "map-poster-health-check/1.0",
          },
        }
      );

      if (response.ok) {
        return {
          success: true,
          attempts: attempt,
        } satisfies HealthCheckResult;
      }

      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    },
    catch: (error) =>
      HealthCheckError.make({
        baseUrl,
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
        attempts: attempt,
        cause: error,
      }),
  });

export class HealthCheckService extends Context.Tag(
  "@map-poster/HealthCheckService"
)<
  HealthCheckService,
  {
    readonly checkApiHealth: (
      baseUrl: string,
      options?: HealthCheckOptions
    ) => Effect.Effect<HealthCheckResult, HealthCheckError>;
  }
>() {
  /**
   * Live implementation - performs actual HTTP health checks with retries
   */
  static readonly layer = Layer.succeed(
    HealthCheckService,
    {
      checkApiHealth: (
        baseUrl: string,
        options?: HealthCheckOptions
      ) => {
        const maxRetries = options?.maxRetries ?? 5;
        const retryDelay = options?.retryDelay ?? 2000;

        const retryPolicy = Schedule.recurs(
          maxRetries - 1
        ).pipe(
          Schedule.intersect(
            Schedule.spaced(`${retryDelay} millis`)
          )
        );

        return checkOnce(baseUrl, 1).pipe(
          Effect.tap(() =>
            Effect.log(
              `✅ [HEALTH-CHECK] API server is ready at ${baseUrl}`
            )
          ),
          Effect.retry(
            retryPolicy.pipe(
              Schedule.tapOutput(([, attempts]) =>
                Effect.log(
                  `⚠️ [HEALTH-CHECK] API server not ready (attempt ${attempts + 1}/${maxRetries}), waiting ${retryDelay}ms...`
                )
              )
            )
          ),
          Effect.mapError((error) =>
            HealthCheckError.make({
              baseUrl,
              message: `API server at ${baseUrl} is not ready after ${maxRetries} attempts`,
              attempts: maxRetries,
              cause: error,
            })
          ),
          Effect.withSpan("HealthCheck.checkApiHealth", {
            attributes: { baseUrl, maxRetries, retryDelay },
          })
        );
      },
    }
  );
}

export const HealthCheckServiceLayer =
  HealthCheckService.layer;
