import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash"),
    passwordSalt: text("password_salt"),
    passwordIterations: integer("password_iterations"),
    emailVerified: integer("email_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    plan: text("plan").notNull().default("free"),
    status: text("status").notNull().default("active"),
    createdAt: text("created_at").notNull(),
    lastLoginAt: text("last_login_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("users_plan_status_idx").on(table.plan, table.status),
    index("users_last_login_idx").on(table.lastLoginAt),
  ],
);

export const sessions = sqliteTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull(),
    lastSeenAt: text("last_seen_at").notNull(),
    expiresAt: text("expires_at").notNull(),
  },
  (table) => [
    index("sessions_user_idx").on(table.userId),
    index("sessions_expiry_idx").on(table.expiresAt),
  ],
);

export const authRateLimits = sqliteTable(
  "auth_rate_limits",
  {
    key: text("key").primaryKey(),
    attempts: integer("attempts").notNull().default(0),
    windowStartedAt: text("window_started_at").notNull(),
    blockedUntil: text("blocked_until"),
  },
  (table) => [index("auth_rate_limits_blocked_idx").on(table.blockedUntil)],
);

export const proInterests = sqliteTable(
  "pro_interests",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    contact: text("contact").notNull().unique(),
    contactChannel: text("contact_channel").notNull(),
    role: text("role").notNull(),
    monthlyVolume: text("monthly_volume").notNull(),
    needs: text("needs").notNull(),
    note: text("note").notNull().default(""),
    source: text("source").notNull().default("pricing"),
    status: text("status").notNull().default("new"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("pro_interests_status_idx").on(table.status, table.createdAt),
  ],
);
