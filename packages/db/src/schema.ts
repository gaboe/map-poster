import {
  pgTable,
  text,
  timestamp,
  boolean,
  bigint,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import {
  type UserRoleValue,
  type UserId,
  type AuthSessionId,
  type OsmDataSourceId,
  type OsmDataSourceStatusValue,
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
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
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
// OSM DATA SOURCES
// =====================
export const osmDataSourcesTable = pgTable(
  "osm_data_sources",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId())
      .$type<OsmDataSourceId>(),
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    geofabrikUrl: text("geofabrik_url").notNull(),
    fileSizeBytes: bigint("file_size_bytes", {
      mode: "number",
    }),
    status: text("status")
      .default("pending")
      .$type<OsmDataSourceStatusValue>()
      .notNull(),
    progress: integer("progress").default(0).notNull(),
    errorMessage: text("error_message"),
    lastImportedAt: timestamp("last_imported_at"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  }
);
