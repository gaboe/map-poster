/**
 * OSM domain - Status models
 */
import { Schema } from "effect";

export const OsmDataSourceStatus = {
  Pending: "pending",
  Downloading: "downloading",
  Converting: "converting",
  Importing: "importing",
  Completed: "completed",
  Failed: "failed",
} as const;

export type OsmDataSourceStatusKey =
  keyof typeof OsmDataSourceStatus;
export type OsmDataSourceStatusValue =
  (typeof OsmDataSourceStatus)[OsmDataSourceStatusKey];

export const osmDataSourceStatuses = Object.values(
  OsmDataSourceStatus
);

export const OsmDataSourceStatusSchema = Schema.Literal(
  OsmDataSourceStatus.Pending,
  OsmDataSourceStatus.Downloading,
  OsmDataSourceStatus.Converting,
  OsmDataSourceStatus.Importing,
  OsmDataSourceStatus.Completed,
  OsmDataSourceStatus.Failed
);
