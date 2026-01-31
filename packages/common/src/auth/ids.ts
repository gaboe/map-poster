/**
 * Auth domain - Branded ID types
 */
import { Schema } from "effect";

/** Branded type for Auth Session IDs (Better Auth sessions) */
export const AuthSessionId = Schema.String.pipe(
  Schema.brand("AuthSessionId")
);
export type AuthSessionId = typeof AuthSessionId.Type;
