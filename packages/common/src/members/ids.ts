/**
 * Member domain - Branded ID types
 */
import { Schema } from "effect";

/** Branded type for Member IDs (organization membership) */
export const MemberId = Schema.String.pipe(
  Schema.brand("MemberId")
);
export type MemberId = typeof MemberId.Type;
