import { Schema } from "effect";

export const Rights = {
  DashboardView: "dashboard-view",
  DashboardEdit: "dashboard-edit",
  DashboardDelete: "dashboard-delete",
  AdminSettings: "admin-settings",
} as const;

export type RightKey = keyof typeof Rights;
export type RightValue = (typeof Rights)[RightKey];

export const UserRole = {
  Admin: "admin",
  User: "user",
} as const;
export type UserRoleKey = keyof typeof UserRole;
export type UserRoleValue = (typeof UserRole)[UserRoleKey];

export const OrganizationRoles = {
  Owner: "owner",
  Admin: "admin",
  Member: "member",
} as const;

export type OrganizationRoleKey =
  keyof typeof OrganizationRoles;
export type OrganizationRoleValue =
  (typeof OrganizationRoles)[OrganizationRoleKey];

export const organizationRoles = Object.values(
  OrganizationRoles
);

export const OrganizationRoleSchema = Schema.Literal(
  OrganizationRoles.Owner,
  OrganizationRoles.Admin,
  OrganizationRoles.Member
);

export const InvitationStatus = {
  Pending: "pending",
  Accepted: "accepted",
  Dismissed: "dismissed",
} as const;

export type InvitationStatusKey =
  keyof typeof InvitationStatus;
export type InvitationStatusValue =
  (typeof InvitationStatus)[InvitationStatusKey];

export const invitationStatuses = Object.values(
  InvitationStatus
);

export const InvitationStatusSchema = Schema.Literal(
  InvitationStatus.Pending,
  InvitationStatus.Accepted,
  InvitationStatus.Dismissed
);

export const ProjectRoles = {
  Viewer: "viewer",
  Editor: "editor",
  Admin: "admin",
} as const;

export type ProjectRoleKey = keyof typeof ProjectRoles;
export type ProjectRoleValue =
  (typeof ProjectRoles)[ProjectRoleKey];

export const projectRoles = Object.values(ProjectRoles);

export const ProjectRoleSchema = Schema.Literal(
  ProjectRoles.Viewer,
  ProjectRoles.Editor,
  ProjectRoles.Admin
);
