import { describe, expect, it } from "@effect/vitest";
import { HealthCheckError } from "../health/health-check";

describe("HealthCheckError", () => {
  it("constructs with expected fields", () => {
    const err = new HealthCheckError({
      baseUrl: "http://api",
      message: "boom",
      attempts: 2,
      cause: new Error("root"),
    });

    expect(err._tag).toBe("HealthCheckError");
    expect(err.baseUrl).toBe("http://api");
    expect(err.message).toBe("boom");
    expect(err.attempts).toBe(2);
  });
});
