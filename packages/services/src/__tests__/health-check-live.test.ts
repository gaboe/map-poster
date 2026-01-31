import { describe, expect, it, vi } from "@effect/vitest";
import { Effect, Either } from "effect";
import {
  HealthCheckService,
  HealthCheckServiceLayer,
} from "../health/health-check";

describe("HealthCheckServiceLive", () => {
  it.effect(
    "returns success when endpoint is ready",
    () => {
      globalThis.fetch = vi.fn(
        async () => new Response("ok", { status: 200 })
      ) as unknown as typeof fetch;

      return Effect.gen(function* () {
        const svc = yield* HealthCheckService;
        const result = yield* svc.checkApiHealth(
          "http://api",
          {
            maxRetries: 1,
            retryDelay: 0,
          }
        );
        expect(result).toEqual({
          success: true,
          attempts: 1,
        });
      }).pipe(Effect.provide(HealthCheckServiceLayer));
    }
  );

  it.effect(
    "retries and succeeds on second attempt",
    () => {
      let calls = 0;

      globalThis.fetch = vi.fn(async () => {
        calls += 1;

        if (calls === 1) {
          return new Response("no", { status: 503 });
        }

        return new Response("ok", { status: 200 });
      }) as unknown as typeof fetch;

      return Effect.gen(function* () {
        const svc = yield* HealthCheckService;
        const result = yield* svc.checkApiHealth(
          "http://api",
          {
            maxRetries: 2,
            retryDelay: 0,
          }
        );
        expect(result.success).toBe(true);
        expect(calls).toBe(2);
      }).pipe(Effect.provide(HealthCheckServiceLayer));
    }
  );

  it.effect(
    "returns HealthCheckError when endpoint is not ready",
    () => {
      globalThis.fetch = vi.fn(
        async () => new Response("no", { status: 503 })
      ) as unknown as typeof fetch;

      return Effect.gen(function* () {
        const svc = yield* HealthCheckService;
        const result = yield* svc
          .checkApiHealth("http://api", {
            maxRetries: 1,
            retryDelay: 0,
          })
          .pipe(Effect.either);

        Either.match(result, {
          onLeft: (error) => {
            expect(error._tag).toBe("HealthCheckError");
            expect(error.baseUrl).toBe("http://api");
            expect(error.attempts).toBe(1);
          },
          onRight: () => {
            expect.fail("Expected Left but got Right");
          },
        });
      }).pipe(Effect.provide(HealthCheckServiceLayer));
    }
  );

  it.effect(
    "returns HealthCheckError when fetch rejects",
    () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error("network down");
      }) as unknown as typeof fetch;

      return Effect.gen(function* () {
        const svc = yield* HealthCheckService;
        const result = yield* svc
          .checkApiHealth("http://api", {
            maxRetries: 1,
            retryDelay: 0,
          })
          .pipe(Effect.either);

        Either.match(result, {
          onLeft: (error) => {
            expect(error._tag).toBe("HealthCheckError");
            expect(error.baseUrl).toBe("http://api");
          },
          onRight: () => {
            expect.fail("Expected Left but got Right");
          },
        });
      }).pipe(Effect.provide(HealthCheckServiceLayer));
    }
  );

  it.effect("handles response.text failure", () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 503,
      text: async () => {
        throw new Error("text failed");
      },
    })) as unknown as typeof fetch;

    return Effect.gen(function* () {
      const svc = yield* HealthCheckService;
      const result = yield* svc
        .checkApiHealth("http://api", {
          maxRetries: 1,
          retryDelay: 0,
        })
        .pipe(Effect.either);

      Either.match(result, {
        onLeft: (error) => {
          expect(error._tag).toBe("HealthCheckError");
        },
        onRight: () => {
          expect.fail("Expected Left but got Right");
        },
      });
    }).pipe(Effect.provide(HealthCheckServiceLayer));
  });
});
