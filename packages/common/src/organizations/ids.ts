/**
 * Organization domain - Branded ID types
 */
import { Schema } from "effect";

/** Branded type for Organization IDs */
export const OrganizationId = Schema.String.pipe(
  Schema.brand("OrganizationId")
);
export type OrganizationId = typeof OrganizationId.Type;
