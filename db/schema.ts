import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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

export const visitorSessions = sqliteTable(
  "visitor_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    firstSeenAt: text("first_seen_at").notNull(),
    lastSeenAt: text("last_seen_at").notNull(),
    landingPath: text("landing_path").notNull(),
    referrer: text("referrer").notNull().default(""),
    source: text("source").notNull().default("direct"),
    country: text("country").notNull().default("unknown"),
    region: text("region").notNull().default(""),
    city: text("city").notNull().default(""),
    deviceType: text("device_type").notNull().default("unknown"),
    pageViewCount: integer("page_view_count").notNull().default(0),
  },
  (table) => [
    index("visitor_sessions_last_seen_idx").on(table.lastSeenAt),
    index("visitor_sessions_user_idx").on(table.userId, table.lastSeenAt),
    index("visitor_sessions_country_idx").on(table.country, table.lastSeenAt),
  ],
);

export const visitorEvents = sqliteTable(
  "visitor_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    visitorId: text("visitor_id")
      .notNull()
      .references(() => visitorSessions.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    eventType: text("event_type").notNull(),
    path: text("path").notNull(),
    country: text("country").notNull().default("unknown"),
    region: text("region").notNull().default(""),
    city: text("city").notNull().default(""),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("visitor_events_created_idx").on(table.createdAt),
    index("visitor_events_type_created_idx").on(
      table.eventType,
      table.createdAt,
    ),
    index("visitor_events_visitor_created_idx").on(
      table.visitorId,
      table.createdAt,
    ),
    index("visitor_events_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const creditUsage = sqliteTable(
  "credit_usage",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    period: text("period").notNull(),
    used: integer("used").notNull().default(0),
    plan: text("plan").notNull().default("free"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("credit_usage_user_period_idx").on(table.userId, table.period),
    index("credit_usage_period_idx").on(table.period),
  ],
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    stripeSubscriptionId: text("stripe_subscription_id").notNull(),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    plan: text("plan").notNull(),
    status: text("status").notNull().default("incomplete"),
    currentPeriodStart: text("current_period_start").notNull(),
    currentPeriodEnd: text("current_period_end").notNull(),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" }).notNull().default(false),
    canceledAt: text("canceled_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("subscriptions_stripe_subscription_unique_idx").on(table.stripeSubscriptionId),
    index("subscriptions_user_idx").on(table.userId),
    index("subscriptions_status_idx").on(table.status, table.currentPeriodEnd),
  ],
);

export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    stripeCheckoutSessionId: text("stripe_checkout_session_id").notNull(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeInvoiceId: text("stripe_invoice_id"),
    plan: text("plan").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("cny"),
    status: text("status").notNull().default("pending"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("orders_checkout_session_unique_idx").on(table.stripeCheckoutSessionId),
    index("orders_user_idx").on(table.userId, table.createdAt),
    index("orders_status_idx").on(table.status),
  ],
);

export const processedWebhookEvents = sqliteTable("processed_webhook_events", {
  eventId: text("event_id").primaryKey(),
  eventType: text("event_type").notNull(),
  createdAt: text("created_at").notNull(),
});
