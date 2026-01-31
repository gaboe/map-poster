import { describe, expect, test } from "vitest";
import { shouldInheritBooleanProperty } from "../utils/array";
import { filterUndefinedValues } from "../utils/object";

describe("utils", () => {
  describe("shouldInheritBooleanProperty", () => {
    test("returns true when empty", () => {
      expect(
        shouldInheritBooleanProperty([], "isEnabled")
      ).toBe(true);
    });

    test("returns true when all true", () => {
      const items = [
        { isEnabled: true },
        { isEnabled: true },
      ];
      expect(
        shouldInheritBooleanProperty(items, "isEnabled")
      ).toBe(true);
    });

    test("returns false when any false", () => {
      const items = [
        { isEnabled: true },
        { isEnabled: false },
      ];
      expect(
        shouldInheritBooleanProperty(items, "isEnabled")
      ).toBe(false);
    });
  });

  describe("filterUndefinedValues", () => {
    test("removes only undefined values", () => {
      const result = filterUndefinedValues({
        a: 1,
        b: undefined,
        c: null,
        d: false,
        e: 0,
        f: "",
      });

      expect(result).toEqual({
        a: 1,
        c: null,
        d: false,
        e: 0,
        f: "",
      });
    });

    test("excludes specified keys", () => {
      const result = filterUndefinedValues(
        {
          a: 1,
          b: 2,
          c: undefined,
        },
        ["b"]
      );

      expect(result).toEqual({ a: 1 });
    });
  });
});
