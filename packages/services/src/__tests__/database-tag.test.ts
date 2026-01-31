import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import type { Db } from "@map-poster/db";
import { Database } from "../context/database";

describe("Database tag", () => {
  it.effect(
    "can provide and access Database service",
    () => {
      const mockDb = {} as unknown as Db;

      const TestLayer = Layer.succeed(Database, mockDb);

      return Effect.gen(function* () {
        const db = yield* Database;
        expect(db).toBe(mockDb);
      }).pipe(Effect.provide(TestLayer));
    }
  );
});
