import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    displayName: text("display_name").notNull(),
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
