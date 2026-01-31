/**
 * Type coercion utilities for safe runtime type conversion
 * Used across the monorepo for converting unknown values to specific types
 */

export const asArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

export const asString = (
  value: unknown,
  fallback = ""
): string => (typeof value === "string" ? value : fallback);

export const asNumber = (
  value: unknown,
  fallback = 0
): number => (typeof value === "number" ? value : fallback);

export const asBoolean = (
  value: unknown,
  fallback = false
): boolean =>
  typeof value === "boolean" ? value : fallback;

export const asRecord = (
  value: unknown
): Record<string, unknown> =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
