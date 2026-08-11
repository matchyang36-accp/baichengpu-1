import Stripe from "stripe";

export type PaymentUser = {
  id: string;
  email: string;
  plan: string;
};

export type PaymentEnv = {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_PRO?: string;
  STRIPE_PRICE_TEAM?: string;
};

const MONTHLY_CREDIT_LIMITS: Record<string, number> = {
  free: 20,
  pro: 500,
  team: 3_000,
};

const PAYMENT_PATHS = new Set([
  "/api/credits",
  "/api/credits/consume",
  "/api/checkout",
  "/api/webhook",
  "/api/subscription",
  "/api/orders",
]);

function json(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function currentPeriod(): string {
  const date = new Date();
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthlyCreditLimit(plan: string): number {
  return MONTHLY_CREDIT_LIMITS[plan] ?? MONTHLY_CREDIT_LIMITS.free;
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function stripeConfiguration(env: PaymentEnv):
  | { enabled: false }
  | { enabled: true; secretKey: string; webhookSecret: string; proPrice: string; teamPrice: string }
  | { enabled: false; missing: string[] } {
  const values = {
    STRIPE_SECRET_KEY: env.STRIPE_SECRET_KEY?.trim(),
    STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET?.trim(),
    STRIPE_PRICE_PRO: env.STRIPE_PRICE_PRO?.trim(),
    STRIPE_PRICE_TEAM: env.STRIPE_PRICE_TEAM?.trim(),
  };
  const configured = Object.values(values).filter(Boolean).length;
  if (configured === 0) return { enabled: false };

  const missing = Object.entries(values)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) return { enabled: false, missing };

  return {
    enabled: true,
    secretKey: values.STRIPE_SECRET_KEY!,
    webhookSecret: values.STRIPE_WEBHOOK_SECRET!,
    proPrice: values.STRIPE_PRICE_PRO!,
    teamPrice: values.STRIPE_PRICE_TEAM!,
  };
}

function stripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: "2026-07-29.dahlia",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16 * 1024) return null;
  try {
    const value = await request.json();
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

async function creditsResponse(env: PaymentEnv, user: PaymentUser): Promise<Response> {
  const period = currentPeriod();
  const record = await env.DB.prepare(
    "SELECT used FROM credit_usage WHERE user_id = ? AND period = ?",
  )
    .bind(user.id, period)
    .first<{ used: number }>();
  const used = record?.used ?? 0;
  const limit = monthlyCreditLimit(user.plan);
  return json({
    ok: true,
    used,
    remaining: Math.max(0, limit - used),
    limit,
    period,
    plan: user.plan,
  });
}

async function consumeCredits(
  request: Request,
  env: PaymentEnv,
  user: PaymentUser,
): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, code: "INVALID_ORIGIN" }, 403);
  const body = await readJson(request);
  const count = typeof body?.count === "number" ? Math.floor(body.count) : 1;
  if (count < 1 || count > 200) return json({ ok: false, code: "INVALID_INPUT" }, 400);

  const period = currentPeriod();
  const limit = monthlyCreditLimit(user.plan);
  const record = await env.DB.prepare(
    "SELECT used FROM credit_usage WHERE user_id = ? AND period = ?",
  )
    .bind(user.id, period)
    .first<{ used: number }>();
  const used = record?.used ?? 0;
  if (used + count > limit) {
    return json(
      { ok: false, code: "QUOTA_EXCEEDED", used, remaining: Math.max(0, limit - used), limit, requested: count },
      429,
    );
  }

  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO credit_usage (user_id, period, used, plan, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, period) DO UPDATE SET
       used = credit_usage.used + excluded.used,
       plan = excluded.plan,
       updated_at = excluded.updated_at`,
  )
    .bind(user.id, period, count, user.plan, now, now)
    .run();

  const newUsed = used + count;
  return json({ ok: true, used: newUsed, remaining: Math.max(0, limit - newUsed), limit, consumed: count });
}

async function createCheckout(
  request: Request,
  env: PaymentEnv,
  user: PaymentUser,
): Promise<Response> {
  if (!sameOrigin(request)) return json({ ok: false, code: "INVALID_ORIGIN" }, 403);
  const configuration = stripeConfiguration(env);
  if (!configuration.enabled) {
    if ("missing" in configuration) {
      console.error(`[payments] CONFIG_MISSING keys=${configuration.missing.join(",")}`);
      return json({ ok: false, code: "PAYMENT_CONFIG_INCOMPLETE" }, 503);
    }
    return json({ ok: false, code: "PAYMENT_DISABLED" }, 503);
  }

  const body = await readJson(request);
  const plan = body?.plan === "pro" || body?.plan === "team" ? body.plan : null;
  const locale = body?.locale === "zh" ? "zh" : "en";
  const requestId =
    typeof body?.requestId === "string" && /^[a-zA-Z0-9_-]{8,80}$/.test(body.requestId)
      ? body.requestId
      : crypto.randomUUID();
  if (!plan) return json({ ok: false, code: "INVALID_PLAN" }, 400);

  const price = plan === "pro" ? configuration.proPrice : configuration.teamPrice;
  const stripe = stripeClient(configuration.secretKey);
  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer_email: user.email,
        client_reference_id: user.id,
        metadata: { userId: user.id, plan, locale },
        subscription_data: { metadata: { userId: user.id, plan } },
        line_items: [{ price, quantity: 1 }],
        success_url: `${new URL(request.url).origin}/${locale}/account?checkout=success`,
        cancel_url: `${new URL(request.url).origin}/${locale}/pricing?checkout=canceled`,
        allow_promotion_codes: true,
        billing_address_collection: "auto",
      },
      { idempotencyKey: `checkout:${user.id}:${plan}:${requestId}` },
    );
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO orders (
        user_id, stripe_checkout_session_id, plan, amount, currency, status, created_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?)
      ON CONFLICT(stripe_checkout_session_id) DO NOTHING`,
    )
      .bind(user.id, session.id, plan, session.amount_total ?? 0, session.currency ?? "cny", now)
      .run();
    return json({ ok: true, url: session.url });
  } catch (reason) {
    console.error("[checkout] CREATE_FAILED", reason);
    return json({ ok: false, code: "CHECKOUT_FAILED" }, 502);
  }
}

function subscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  return {
    start: item?.current_period_start ?? Math.floor(Date.now() / 1_000),
    end: item?.current_period_end ?? Math.floor(Date.now() / 1_000),
  };
}

async function processWebhookEvent(event: Stripe.Event, env: PaymentEnv): Promise<void> {
  const now = new Date().toISOString();
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id || session.metadata?.userId;
    const plan = session.metadata?.plan;
    if (userId && (plan === "pro" || plan === "team")) {
      await env.DB.batch([
        env.DB.prepare(
          "UPDATE orders SET status = 'completed', stripe_payment_intent_id = ? WHERE stripe_checkout_session_id = ?",
        ).bind(typeof session.payment_intent === "string" ? session.payment_intent : null, session.id),
        env.DB.prepare("UPDATE users SET plan = ?, updated_at = ? WHERE id = ?").bind(plan, now, userId),
      ]);
    }
    return;
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    const userId = subscription.metadata.userId;
    const plan = subscription.metadata.plan === "team" ? "team" : "pro";
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    if (!userId || !customerId) {
      console.warn(`[webhook] SUBSCRIPTION_METADATA_MISSING event=${event.id}`);
      return;
    }
    const period = subscriptionPeriod(subscription);
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO subscriptions (
          user_id, stripe_subscription_id, stripe_customer_id, plan, status,
          current_period_start, current_period_end, cancel_at_period_end,
          canceled_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(stripe_subscription_id) DO UPDATE SET
          plan = excluded.plan,
          status = excluded.status,
          current_period_start = excluded.current_period_start,
          current_period_end = excluded.current_period_end,
          cancel_at_period_end = excluded.cancel_at_period_end,
          canceled_at = excluded.canceled_at,
          updated_at = excluded.updated_at`,
      ).bind(
        userId,
        subscription.id,
        customerId,
        plan,
        subscription.status,
        new Date(period.start * 1_000).toISOString(),
        new Date(period.end * 1_000).toISOString(),
        subscription.cancel_at_period_end ? 1 : 0,
        subscription.canceled_at ? new Date(subscription.canceled_at * 1_000).toISOString() : null,
        now,
        now,
      ),
      env.DB.prepare("UPDATE users SET plan = ?, updated_at = ? WHERE id = ?").bind(
        subscription.status === "canceled" || subscription.status === "unpaid" ? "free" : plan,
        now,
        userId,
      ),
    ]);
    return;
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const userId = subscription.metadata.userId;
    const statements = [
      env.DB.prepare(
        "UPDATE subscriptions SET status = 'canceled', canceled_at = ?, updated_at = ? WHERE stripe_subscription_id = ?",
      ).bind(now, now, subscription.id),
    ];
    if (userId) {
      statements.push(env.DB.prepare("UPDATE users SET plan = 'free', updated_at = ? WHERE id = ?").bind(now, userId));
    }
    await env.DB.batch(statements);
  }
}

async function handleWebhook(request: Request, env: PaymentEnv): Promise<Response> {
  const configuration = stripeConfiguration(env);
  if (!configuration.enabled) {
    if ("missing" in configuration) console.error(`[payments] CONFIG_MISSING keys=${configuration.missing.join(",")}`);
    return json({ ok: false, code: "PAYMENT_NOT_CONFIGURED" }, 503);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return json({ ok: false, code: "SIGNATURE_REQUIRED" }, 400);
  const stripe = stripeClient(configuration.secretKey);
  let event: Stripe.Event | null = null;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      configuration.webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
    const inserted = await env.DB.prepare(
      "INSERT OR IGNORE INTO processed_webhook_events (event_id, event_type, created_at) VALUES (?, ?, ?)",
    )
      .bind(event.id, event.type, new Date().toISOString())
      .run();
    if ((inserted.meta.changes ?? 0) === 0) return json({ received: true, duplicate: true });

    await processWebhookEvent(event, env);
    return json({ received: true });
  } catch (reason) {
    if (event) {
      await env.DB.prepare("DELETE FROM processed_webhook_events WHERE event_id = ?").bind(event.id).run();
    }
    console.error("[webhook] PROCESS_FAILED", reason);
    return json({ ok: false, code: "WEBHOOK_ERROR" }, 400);
  }
}

async function subscriptionResponse(env: PaymentEnv, user: PaymentUser): Promise<Response> {
  const subscription = await env.DB.prepare(
    "SELECT status, current_period_start, current_period_end, cancel_at_period_end FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
  )
    .bind(user.id)
    .first<Record<string, unknown>>();
  return json({
    ok: true,
    plan: user.plan,
    subscription: subscription
      ? {
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end === 1 || subscription.cancel_at_period_end === true,
        }
      : null,
  });
}

async function ordersResponse(env: PaymentEnv, user: PaymentUser): Promise<Response> {
  const result = await env.DB.prepare(
    "SELECT plan, amount, currency, status, created_at AS createdAt FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
  )
    .bind(user.id)
    .all();
  return json({ ok: true, orders: result.results ?? [] });
}

export async function handlePaymentRequest(
  request: Request,
  env: PaymentEnv,
  user: PaymentUser | null,
): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  if (!PAYMENT_PATHS.has(pathname)) return null;
  if (pathname === "/api/webhook" && request.method === "POST") return handleWebhook(request, env);
  if (!user) return json({ ok: false, code: "AUTH_REQUIRED" }, 401);

  if (pathname === "/api/credits" && request.method === "GET") return creditsResponse(env, user);
  if (pathname === "/api/credits/consume" && request.method === "POST") return consumeCredits(request, env, user);
  if (pathname === "/api/checkout" && request.method === "POST") return createCheckout(request, env, user);
  if (pathname === "/api/subscription" && request.method === "GET") return subscriptionResponse(env, user);
  if (pathname === "/api/orders" && request.method === "GET") return ordersResponse(env, user);
  return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405);
}
