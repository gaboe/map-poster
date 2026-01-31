import {
  pgTable,
  text,
  timestamp,
  boolean,
  unique,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  type OrganizationRoleValue,
  type UserRoleValue,
  type InvitationStatusValue,
  type ProjectRoleValue,
  type UserId,
  type OrganizationId,
  type ProjectId,
  type MemberId,
  type InvitationId,
  type AuthSessionId,
} from "@map-poster/common";

// =====================
// BETTER AUTH TABLES
// =====================
export const usersTable = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId())
    .$type<UserId>(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role").$type<UserRoleValue>(),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

// export for better-auth
export const user = usersTable;

export const sessionsTable = pgTable(
  "sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId())
      .$type<AuthSessionId>(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
      })
      .$type<UserId>(),
    impersonatedBy: text(
      "impersonated_by"
    ).$type<UserId | null>(),
    activeOrganizationId: text(
      "active_organization_id"
    ).$type<OrganizationId | null>(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
    index("sessions_active_org_idx").on(
      table.activeOrganizationId
    ),
  ]
);

// export for better-auth
export const session = sessionsTable;

export const accountsTable = pgTable(
  "accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
      })
      .$type<UserId>(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp(
      "access_token_expires_at"
    ),
    refreshTokenExpiresAt: timestamp(
      "refresh_token_expires_at"
    ),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("accounts_user_id_idx").on(table.userId),
    uniqueIndex("accounts_provider_user_idx").on(
      table.providerId,
      table.userId
    ),
    index("accounts_account_id_idx").on(table.accountId),
  ]
);

// export for better-auth
export const account = accountsTable;

export const verificationsTable = pgTable(
  "verifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").$defaultFn(
      () => /* @__PURE__ */ new Date()
    ),
    updatedAt: timestamp("updated_at").$defaultFn(
      () => /* @__PURE__ */ new Date()
    ),
  },
  (table) => [
    index("verifications_identifier_idx").on(
      table.identifier
    ),
  ]
);

// export for better-auth
export const verification = verificationsTable;

// =====================
// BETTER AUTH ORGANIZATION TABLES
// =====================
export const organizationsTable = pgTable(
  "organizations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId())
      .$type<OrganizationId>(),
    name: text("name").notNull(),
    slug: text("slug").unique(),
    logo: text("logo"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("organizations_name_idx").on(table.name),
  ]
);

// export for better-auth
export const organization = organizationsTable;

export const membersTable = pgTable(
  "members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId())
      .$type<MemberId>(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
      })
      .$type<UserId>(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationsTable.id, {
        onDelete: "cascade",
      })
      .$type<OrganizationId>(),
    role: text("role")
      .$type<OrganizationRoleValue>()
      .default("member")
      .notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("members_user_id_idx").on(table.userId),
    index("members_organization_id_idx").on(
      table.organizationId
    ),
  ]
);

// export for better-auth
export const member = membersTable;

export const invitationsTable = pgTable(
  "invitations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId())
      .$type<InvitationId>(),
    email: text("email").notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
      })
      .$type<UserId>(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationsTable.id, {
        onDelete: "cascade",
      })
      .$type<OrganizationId>(),
    role: text("role").$type<OrganizationRoleValue>(),
    status: text("status")
      .default("pending")
      .$type<InvitationStatusValue>()
      .notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("invitations_email_idx").on(table.email),
    index("invitations_organization_id_idx").on(
      table.organizationId
    ),
    index("idx_invitations_inviter_id").on(table.inviterId),
  ]
);

// export for better-auth
export const invitation = invitationsTable;

// =====================
// KEEP CUSTOM PERMISSIONS (for now)
// =====================
// Note: We'll migrate these to Better Auth permissions later

// --- BETTER AUTH ORGANIZATION RELATIONS ---
export const organizationsRelations = relations(
  organizationsTable,
  ({ many }) => ({
    projects: many(projectsTable),
    members: many(membersTable),
    invitations: many(invitationsTable),
  })
);

export const membersRelations = relations(
  membersTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [membersTable.userId],
      references: [usersTable.id],
    }),
    organization: one(organizationsTable, {
      fields: [membersTable.organizationId],
      references: [organizationsTable.id],
    }),
  })
);

export const invitationsRelations = relations(
  invitationsTable,
  ({ one }) => ({
    inviter: one(usersTable, {
      fields: [invitationsTable.inviterId],
      references: [usersTable.id],
    }),
    organization: one(organizationsTable, {
      fields: [invitationsTable.organizationId],
      references: [organizationsTable.id],
    }),
  })
);

// =====================
// PROJECT TABLES & RELATIONS
// =====================
export const projectsTable = pgTable(
  "projects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId())
      .$type<ProjectId>(),
    name: text("name").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationsTable.id, {
        onDelete: "cascade",
      })
      .$type<OrganizationId>(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("idx_projects_organization_id").on(
      table.organizationId
    ),
  ]
);

export const projectMembersTable = pgTable(
  "project_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
      })
      .$type<UserId>(),
    projectId: text("project_id")
      .notNull()
      .references(() => projectsTable.id, {
        onDelete: "cascade",
      })
      .$type<ProjectId>(),
    role: text("role")
      .$type<ProjectRoleValue>()
      .default("viewer")
      .notNull(),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    unique().on(table.userId, table.projectId),
    index("idx_project_members_project_id").on(
      table.projectId
    ),
  ]
);

// --- PROJECT RELATIONS ---
export const projectsRelations = relations(
  projectsTable,
  ({ one, many }) => ({
    organization: one(organizationsTable, {
      fields: [projectsTable.organizationId],
      references: [organizationsTable.id],
    }),
    members: many(projectMembersTable),
  })
);

export const projectMembersRelations = relations(
  projectMembersTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [projectMembersTable.userId],
      references: [usersTable.id],
    }),
    project: one(projectsTable, {
      fields: [projectMembersTable.projectId],
      references: [projectsTable.id],
    }),
  })
);

// --- USER RELATIONS ---
export const usersTableRelations = relations(
  usersTable,
  ({ many }) => ({
    members: many(membersTable),
    sentInvitations: many(invitationsTable),
    projectMemberships: many(projectMembersTable),
  })
);
