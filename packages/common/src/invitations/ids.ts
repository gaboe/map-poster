/**
 * Invitation domain - Branded ID types
 */
import { Schema } from "effect";

/** Branded type for Invitation IDs */
export const InvitationId = Schema.String.pipe(
  Schema.brand("InvitationId")
);
export type InvitationId = typeof InvitationId.Type;
