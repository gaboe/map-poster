import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { HealthCheckService } from "../health/health-check";

describe("HealthCheckService", () => {
  it.effect("can provide and use service via Layer", () => {
    const TestLayer = Layer.succeed(HealthCheckService, {
      checkApiHealth: (_baseUrl: string) =>
        Effect.succeed({ success: true, attempts: 1 }),
    });

    return Effect.gen(function* () {
      const svc = yield* HealthCheckService;
      const result =
        yield* svc.checkApiHealth("http://api");
      expect(result).toEqual({
        success: true,
        attempts: 1,
      });
    }).pipe(Effect.provide(TestLayer));
  });
});
