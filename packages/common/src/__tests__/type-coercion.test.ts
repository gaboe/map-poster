import { describe, expect, test } from "vitest";
import {
  asArray,
  asBoolean,
  asNumber,
  asRecord,
  asString,
} from "../type-coercion";

describe("type-coercion", () => {
  test("asArray returns array or empty array", () => {
    expect(asArray([1, 2, 3])).toEqual([1, 2, 3]);
    expect(asArray("not-array")).toEqual([]);
    expect(asArray(null)).toEqual([]);
  });

  test("asString returns string or fallback", () => {
    expect(asString("abc")).toBe("abc");
    expect(asString(123)).toBe("");
    expect(asString(123, "fallback")).toBe("fallback");
  });

  test("asNumber returns number or fallback", () => {
    expect(asNumber(42)).toBe(42);
    expect(asNumber("42")).toBe(0);
    expect(asNumber("42", 123)).toBe(123);
  });

  test("asBoolean returns boolean or fallback", () => {
    expect(asBoolean(true)).toBe(true);
    expect(asBoolean(false)).toBe(false);
    expect(asBoolean("true")).toBe(false);
    expect(asBoolean("true", true)).toBe(true);
  });

  test("asRecord returns plain object or empty record", () => {
    expect(asRecord({ a: 1 })).toEqual({ a: 1 });
    expect(asRecord([1, 2, 3])).toEqual({});
    expect(asRecord(null)).toEqual({});
    expect(asRecord("nope")).toEqual({});
  });
});
