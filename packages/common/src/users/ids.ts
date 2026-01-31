/**
 * User domain - Branded ID types
 */
import { Schema } from "effect";

/** Branded type for User IDs */
export const UserId = Schema.String.pipe(
  Schema.brand("UserId")
);
export type UserId = typeof UserId.Type;
