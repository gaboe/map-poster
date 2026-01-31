/**
 * Project domain - Branded ID types
 */
import { Schema } from "effect";

/** Branded type for Project IDs */
export const ProjectId = Schema.String.pipe(
  Schema.brand("ProjectId")
);
export type ProjectId = typeof ProjectId.Type;
