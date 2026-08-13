/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import {
  normalizeAdminPagePath,
  safeAdminReturnPath,
} from "../shared/admin-navigation";
import { handlePaymentRequest } from "./payments";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  ADMIN_EMAILS?: string;
  RESEND_API_KEY?: string;
  PASSWORD_RESET_FROM?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_PRO?: string;
  STRIPE_PRICE_TEAM?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  plan: string;
};

type StoredCredential = SessionUser & {
  passwordHash: string | null;
  passwordSalt: string | null;
  passwordIterations: number | null;
  status: string;
};

const SESSION_COOKIE = "bcp_session";
const VISITOR_COOKIE = "bcp_visitor";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const VISITOR_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const PASSWORD_ITERATIONS = 100_000;
const AUTH_BODY_LIMIT_BYTES = 16 * 1024;
const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000;
const AUTH_RATE_BLOCK_MS = 30 * 60 * 1000;
const AUTH_RATE_MAX_ATTEMPTS = 8;
const PASSWORD_RESET_CODE_MAX_AGE_MS = 10 * 60 * 1000;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;
const PASSWORD_RESET_MAX_EMAILS_PER_HOUR = 3;
const LOCALE_HEADER = "x-baichengpu-locale";
const INTERNAL_USER_HEADERS = {
  id: "x-baichengpu-user-id",
  email: "x-baichengpu-user-email",
  name: "x-baichengpu-user-name",
  admin: "x-baichengpu-admin",
  plan: "x-baichengpu-user-plan",
} as const;

function json(value: unknown, status: number, headers?: HeadersInit) {
  return Response.json(value, {
    status,
    headers: {
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  const email = value.trim().toLocaleLowerCase();
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return "";
  }
  return email;
}

function normalizeDisplayName(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 50);
}

function isStrongPassword(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 10 &&
    value.length <= 128 &&
    /[A-Za-z]/.test(value) &&
    /\d/.test(value)
  );
}

function isAdminEmail(email: string, configuredEmails?: string): boolean {
  if (!configuredEmails) return false;
  const normalizedEmail = email.trim().toLocaleLowerCase();
  return configuredEmails
    .split(",")
    .map((item) => item.trim().toLocaleLowerCase())
    .filter(Boolean)
    .includes(normalizedEmail);
}

function parseCookies(request: Request): Map<string, string> {
  const cookies = new Map<string, string>();
  for (const pair of (request.headers.get("cookie") ?? "").split(";")) {
    const index = pair.indexOf("=");
    if (index <= 0) continue;
    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (name) cookies.set(name, value);
  }
  return cookies;
}

function sessionCookie(request: Request, token: string): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`;
}

function clearSessionCookie(request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function visitorCookie(request: Request, visitorId: string): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${VISITOR_COOKIE}=${visitorId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${VISITOR_MAX_AGE_SECONDS}${secure}`;
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function readSmallJson(request: Request): Promise<Record<string, unknown> | null> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > AUTH_BODY_LIMIT_BYTES) return null;
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > AUTH_BODY_LIMIT_BYTES) {
    return null;
  }
  try {
    const value = JSON.parse(text) as unknown;
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return bytesToBase64(new Uint8Array(digest));
}

async function hashPassword(
  password: string,
  salt: Uint8Array<ArrayBufferLike> = crypto.getRandomValues(
    new Uint8Array(16),
  ),
  iterations = PASSWORD_ITERATIONS,
): Promise<{ hash: string; salt: string; iterations: number }> {
  const saltBytes = Uint8Array.from(salt);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBytes,
      iterations,
    },
    key,
    256,
  );
  return {
    hash: bytesToBase64(new Uint8Array(bits)),
    salt: bytesToBase64(saltBytes),
    iterations,
  };
}

async function verifyPassword(
  password: string,
  expectedHash: string,
  salt: string,
  iterations: number,
): Promise<boolean> {
  const derived = await hashPassword(password, base64ToBytes(salt), iterations);
  const actual = base64ToBytes(derived.hash);
  const expected = base64ToBytes(expectedHash);
  if (actual.length !== expected.length) return false;

  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual[index] ^ expected[index];
  }
  return difference === 0;
}

async function createSession(
  request: Request,
  db: D1Database,
  userId: string,
): Promise<string> {
  const token = bytesToBase64(crypto.getRandomValues(new Uint8Array(32)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  const tokenHash = await sha256(token);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + SESSION_MAX_AGE_SECONDS * 1000,
  ).toISOString();
  await db
    .prepare(
      `INSERT INTO sessions (
        token_hash, user_id, created_at, last_seen_at, expires_at
      ) VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(tokenHash, userId, now.toISOString(), now.toISOString(), expiresAt)
    .run();
  return token;
}

async function readSessionUser(
  request: Request,
  db: D1Database,
): Promise<SessionUser | null> {
  const token = parseCookies(request).get(SESSION_COOKIE);
  if (!token || token.length > 128) return null;
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const user = await db
    .prepare(
      `SELECT
        users.id AS id,
        users.email AS email,
        users.display_name AS displayName,
        users.plan AS plan
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
        AND sessions.expires_at > ?
        AND users.status = 'active'
      LIMIT 1`,
    )
    .bind(tokenHash, now)
    .first<SessionUser>();
  return user ?? null;
}

async function rateLimitAuth(
  request: Request,
  db: D1Database,
  email: string,
): Promise<boolean> {
  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  const key = await sha256(`${ip}|${email || "invalid"}`);
  const now = Date.now();
  const record = await db
    .prepare(
      `SELECT
        attempts,
        window_started_at AS windowStartedAt,
        blocked_until AS blockedUntil
      FROM auth_rate_limits
      WHERE key = ?
      LIMIT 1`,
    )
    .bind(key)
    .first<{
      attempts: number;
      windowStartedAt: string;
      blockedUntil: string | null;
    }>();

  if (record?.blockedUntil && Date.parse(record.blockedUntil) > now) {
    return false;
  }

  const windowStartedAt = record ? Date.parse(record.windowStartedAt) : 0;
  const withinWindow = now - windowStartedAt < AUTH_RATE_WINDOW_MS;
  const attempts = withinWindow ? record?.attempts ?? 0 : 0;
  const nextAttempts = attempts + 1;
  const blockedUntil =
    nextAttempts >= AUTH_RATE_MAX_ATTEMPTS
      ? new Date(now + AUTH_RATE_BLOCK_MS).toISOString()
      : null;

  await db
    .prepare(
      `INSERT INTO auth_rate_limits (
        key, attempts, window_started_at, blocked_until
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        attempts = excluded.attempts,
        window_started_at = excluded.window_started_at,
        blocked_until = excluded.blocked_until`,
    )
    .bind(
      key,
      nextAttempts,
      withinWindow && record
        ? record.windowStartedAt
        : new Date(now).toISOString(),
      blockedUntil,
    )
    .run();
  return blockedUntil === null;
}

async function clearAuthRateLimit(
  request: Request,
  db: D1Database,
  email: string,
) {
  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  const key = await sha256(`${ip}|${email}`);
  await db.prepare("DELETE FROM auth_rate_limits WHERE key = ?").bind(key).run();
}

function generatePasswordResetCode(): string {
  const random = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return random.toString().padStart(6, "0");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendPasswordResetEmail(
  env: Env,
  email: string,
  displayName: string,
  code: string,
  requestId: string,
): Promise<void> {
  if (!env.RESEND_API_KEY) throw new Error("RESEND_NOT_CONFIGURED");
  const sender =
    env.PASSWORD_RESET_FROM ?? "白橙铺 <no-reply@send.edit-photo.com>";
  const safeName = escapeHtml(displayName || "用户");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
      "idempotency-key": `password-reset-${requestId}`,
    },
    body: JSON.stringify({
      from: sender,
      to: [email],
      subject: "白橙铺密码重置验证码",
      text: `你好，${displayName || "用户"}。你的白橙铺密码重置验证码是：${code}。验证码 10 分钟内有效。如果不是你本人操作，请忽略此邮件。`,
      html: `<div style="font-family:Arial,'Microsoft YaHei',sans-serif;line-height:1.7;color:#172033;max-width:560px;margin:auto;padding:32px"><p>${safeName}，你好：</p><p>你正在重置白橙铺账户密码，本次验证码为：</p><div style="font-size:34px;font-weight:800;letter-spacing:8px;color:#7846f5;background:#f5f1ff;border-radius:16px;padding:18px 22px;text-align:center">${code}</div><p>验证码将在 10 分钟后失效，并且最多可尝试 ${PASSWORD_RESET_MAX_ATTEMPTS} 次。</p><p style="color:#6b7280">如果不是你本人操作，请忽略此邮件。请勿将验证码转发给任何人。</p></div>`,
    }),
  });
  if (!response.ok) {
    throw new Error(`RESEND_FAILED_${response.status}`);
  }
}

async function handlePasswordResetRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  if (!isSameOrigin(request)) {
    return json({ ok: false, code: "INVALID_ORIGIN" }, 403);
  }
  if (!env.RESEND_API_KEY) {
    return json({ ok: false, code: "EMAIL_NOT_CONFIGURED" }, 503);
  }
  const body = await readSmallJson(request);
  const email = normalizeEmail(body?.email);
  if (!email) return json({ ok: false, code: "INVALID_INPUT" }, 400);

  const genericSuccess = () => json({ ok: true }, 200);
  const user = await env.DB
    .prepare(
      "SELECT id, display_name AS displayName FROM users WHERE email = ? AND status = 'active' LIMIT 1",
    )
    .bind(email)
    .first<{ id: string; displayName: string }>();
  if (!user) return genericSuccess();

  const recentRequests = await env.DB
    .prepare(
      `SELECT COUNT(*) AS count
      FROM password_reset_codes
      WHERE user_id = ? AND created_at >= ?`,
    )
    .bind(user.id, new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .first<{ count: number }>();
  if ((recentRequests?.count ?? 0) >= PASSWORD_RESET_MAX_EMAILS_PER_HOUR) {
    return genericSuccess();
  }

  const id = crypto.randomUUID();
  const code = generatePasswordResetCode();
  const credential = await hashPassword(code);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + PASSWORD_RESET_CODE_MAX_AGE_MS,
  ).toISOString();
  await env.DB
    .prepare(
      `INSERT INTO password_reset_codes (
        id, user_id, code_hash, code_salt, code_iterations, attempts,
        created_at, expires_at, used_at
      ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, NULL)`,
    )
    .bind(
      id,
      user.id,
      credential.hash,
      credential.salt,
      credential.iterations,
      now.toISOString(),
      expiresAt,
    )
    .run();

  try {
    await sendPasswordResetEmail(env, email, user.displayName, code, id);
  } catch (reason) {
    await env.DB
      .prepare("DELETE FROM password_reset_codes WHERE id = ?")
      .bind(id)
      .run();
    console.error("[password-reset] EMAIL_SEND_FAILED", reason);
    return json({ ok: false, code: "EMAIL_SEND_FAILED" }, 503);
  }
  await env.DB
    .prepare(
      "UPDATE password_reset_codes SET used_at = ? WHERE user_id = ? AND used_at IS NULL AND id != ?",
    )
    .bind(now.toISOString(), user.id, id)
    .run();
  return genericSuccess();
}

async function handlePasswordResetConfirm(
  request: Request,
  env: Env,
): Promise<Response> {
  if (!isSameOrigin(request)) {
    return json({ ok: false, code: "INVALID_ORIGIN" }, 403);
  }
  const body = await readSmallJson(request);
  const email = normalizeEmail(body?.email);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const password = body?.password;
  if (!email || !/^\d{6}$/.test(code) || !isStrongPassword(password)) {
    return json(
      {
        ok: false,
        code:
          typeof password === "string" && !isStrongPassword(password)
            ? "WEAK_PASSWORD"
            : "INVALID_INPUT",
      },
      400,
    );
  }
  if (!(await rateLimitAuth(request, env.DB, `reset-confirm:${email}`))) {
    return json({ ok: false, code: "RATE_LIMITED" }, 429);
  }

  const reset = await env.DB
    .prepare(
      `SELECT
        password_reset_codes.id AS id,
        password_reset_codes.user_id AS userId,
        password_reset_codes.code_hash AS codeHash,
        password_reset_codes.code_salt AS codeSalt,
        password_reset_codes.code_iterations AS codeIterations,
        password_reset_codes.attempts AS attempts
      FROM password_reset_codes
      INNER JOIN users ON users.id = password_reset_codes.user_id
      WHERE users.email = ?
        AND users.status = 'active'
        AND password_reset_codes.used_at IS NULL
        AND password_reset_codes.expires_at > ?
      ORDER BY password_reset_codes.created_at DESC
      LIMIT 1`,
    )
    .bind(email, new Date().toISOString())
    .first<{
      id: string;
      userId: string;
      codeHash: string;
      codeSalt: string;
      codeIterations: number;
      attempts: number;
    }>();
  if (!reset || reset.attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
    return json({ ok: false, code: "CODE_INVALID_OR_EXPIRED" }, 400);
  }

  const matches = await verifyPassword(
    code,
    reset.codeHash,
    reset.codeSalt,
    reset.codeIterations,
  );
  if (!matches) {
    await env.DB
      .prepare("UPDATE password_reset_codes SET attempts = attempts + 1 WHERE id = ?")
      .bind(reset.id)
      .run();
    return json({ ok: false, code: "CODE_INVALID_OR_EXPIRED" }, 400);
  }

  const credential = await hashPassword(password);
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB
      .prepare(
        `UPDATE users SET
          password_hash = ?, password_salt = ?, password_iterations = ?,
          updated_at = ?
        WHERE id = ?`,
      )
      .bind(
        credential.hash,
        credential.salt,
        credential.iterations,
        now,
        reset.userId,
      ),
    env.DB
      .prepare("UPDATE password_reset_codes SET used_at = ? WHERE id = ?")
      .bind(now, reset.id),
    env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(reset.userId),
  ]);
  await clearAuthRateLimit(request, env.DB, `reset-confirm:${email}`);
  return json({ ok: true }, 200);
}

async function handleAuthRequest(
  request: Request,
  db: D1Database,
  action: "register" | "login" | "logout",
): Promise<Response> {
  if (!isSameOrigin(request)) {
    return json({ ok: false, code: "INVALID_ORIGIN" }, 403);
  }

  if (action === "logout") {
    const token = parseCookies(request).get(SESSION_COOKIE);
    if (token && token.length <= 128) {
      await db
        .prepare("DELETE FROM sessions WHERE token_hash = ?")
        .bind(await sha256(token))
        .run();
    }
    return json(
      { ok: true },
      200,
      { "set-cookie": clearSessionCookie(request) },
    );
  }

  const body = await readSmallJson(request);
  if (!body) return json({ ok: false, code: "INVALID_INPUT" }, 400);
  const email = normalizeEmail(body.email);
  const password = body.password;
  if (!(await rateLimitAuth(request, db, email))) {
    return json({ ok: false, code: "RATE_LIMITED" }, 429);
  }

  if (!email || typeof password !== "string") {
    return json({ ok: false, code: "INVALID_INPUT" }, 400);
  }

  if (action === "register") {
    const displayName = normalizeDisplayName(body.displayName);
    if (!displayName || !isStrongPassword(password)) {
      return json(
        {
          ok: false,
          code: isStrongPassword(password) ? "INVALID_INPUT" : "WEAK_PASSWORD",
        },
        400,
      );
    }

    const existing = await db
      .prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
      .bind(email)
      .first<{ id: string }>();
    if (existing) {
      return json({ ok: false, code: "EMAIL_EXISTS" }, 409);
    }

    const id = crypto.randomUUID();
    const credential = await hashPassword(password);
    const now = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO users (
          id, email, display_name, password_hash, password_salt,
          password_iterations, email_verified, plan, status,
          created_at, last_login_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 'free', 'active', ?, ?, ?)`,
      )
      .bind(
        id,
        email,
        displayName,
        credential.hash,
        credential.salt,
        credential.iterations,
        now,
        now,
        now,
      )
      .run();
    const token = await createSession(request, db, id);
    await clearAuthRateLimit(request, db, email);
    return json(
      { ok: true },
      201,
      { "set-cookie": sessionCookie(request, token) },
    );
  }

  const user = await db
    .prepare(
      `SELECT
        id,
        email,
        display_name AS displayName,
        password_hash AS passwordHash,
        password_salt AS passwordSalt,
        password_iterations AS passwordIterations,
        status
      FROM users
      WHERE email = ?
      LIMIT 1`,
    )
    .bind(email)
    .first<StoredCredential>();
  if (!user) {
    return json({ ok: false, code: "INVALID_CREDENTIALS" }, 401);
  }
  if (user.status !== "active") {
    return json({ ok: false, code: "ACCOUNT_DISABLED" }, 401);
  }
  if (
    !user.passwordHash ||
    !user.passwordSalt ||
    !user.passwordIterations ||
    !(await verifyPassword(
      password,
      user.passwordHash,
      user.passwordSalt,
      user.passwordIterations,
    ))
  ) {
    return json({ ok: false, code: "INVALID_CREDENTIALS" }, 401);
  }

  const now = new Date().toISOString();
  await db
    .prepare(
      "UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?",
    )
    .bind(now, now, user.id)
    .run();
  const token = await createSession(request, db, user.id);
  await clearAuthRateLimit(request, db, email);
  return json(
    { ok: true },
    200,
    { "set-cookie": sessionCookie(request, token) },
  );
}

type RequestGeo = {
  country?: string;
  region?: string;
  city?: string;
};

const ANALYTICS_EVENT_TYPES = new Set([
  "page_view",
  "cutout_started",
  "cutout_completed",
  "download",
  "batch_started",
  "batch_completed",
]);

function hasAnalyticsOptOut(request: Request): boolean {
  return (
    request.headers.get("sec-gpc") === "1" ||
    request.headers.get("dnt") === "1"
  );
}

function getRequestGeo(request: Request) {
  const cf = (request as Request & { cf?: RequestGeo }).cf;
  return {
    country: (cf?.country ?? "unknown").slice(0, 8),
    region: (cf?.region ?? "").slice(0, 100),
    city: (cf?.city ?? "").slice(0, 100),
  };
}

function getDeviceType(request: Request): string {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (/bot|crawler|spider|slurp/i.test(userAgent)) return "bot";
  if (/ipad|tablet|kindle|silk/i.test(userAgent)) return "tablet";
  if (/mobile|iphone|android/i.test(userAgent)) return "mobile";
  return userAgent ? "desktop" : "unknown";
}

function normalizeAnalyticsPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  const path = value.trim().slice(0, 500);
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path.split("?")[0].split("#")[0] || "/";
}

function analyticsSource(referrer: string, request: Request): string {
  if (!referrer) return "direct";
  try {
    const referrerUrl = new URL(referrer);
    if (referrerUrl.hostname === new URL(request.url).hostname) return "internal";
    return referrerUrl.hostname.replace(/^www\./, "").slice(0, 120);
  } catch {
    return "other";
  }
}

async function handleAnalyticsEvent(
  request: Request,
  db: D1Database,
  authenticatedUser: SessionUser | null,
): Promise<Response> {
  if (!isSameOrigin(request)) {
    return json({ ok: false, code: "INVALID_ORIGIN" }, 403);
  }
  if (hasAnalyticsOptOut(request)) {
    return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  }

  const body = await readSmallJson(request);
  const eventType = typeof body?.eventType === "string" ? body.eventType : "";
  if (!body || !ANALYTICS_EVENT_TYPES.has(eventType)) {
    return json({ ok: false, code: "INVALID_INPUT" }, 400);
  }

  const cookies = parseCookies(request);
  const existingVisitorId = cookies.get(VISITOR_COOKIE) ?? "";
  const hasValidVisitorId = /^[0-9a-f-]{36}$/i.test(existingVisitorId);
  const visitorId = hasValidVisitorId ? existingVisitorId : crypto.randomUUID();
  const path = normalizeAnalyticsPath(body.path);
  if (path.startsWith("/admin")) {
    return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  }

  const referrer =
    typeof body.referrer === "string"
      ? body.referrer.trim().slice(0, 500)
      : "";
  const source = analyticsSource(referrer, request);
  const geo = getRequestGeo(request);
  const deviceType = getDeviceType(request);
  if (deviceType === "bot") {
    return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  }

  const now = new Date().toISOString();
  const isPageView = eventType === "page_view" ? 1 : 0;
  await db.batch([
    db
      .prepare(
        `INSERT INTO visitor_sessions (
          id, user_id, first_seen_at, last_seen_at, landing_path, referrer,
          source, country, region, city, device_type, page_view_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          user_id = COALESCE(excluded.user_id, visitor_sessions.user_id),
          last_seen_at = excluded.last_seen_at,
          country = excluded.country,
          region = excluded.region,
          city = excluded.city,
          device_type = excluded.device_type,
          page_view_count = visitor_sessions.page_view_count + excluded.page_view_count`,
      )
      .bind(
        visitorId,
        authenticatedUser?.id ?? null,
        now,
        now,
        path,
        referrer,
        source,
        geo.country,
        geo.region,
        geo.city,
        deviceType,
        isPageView,
      ),
    db
      .prepare(
        `INSERT INTO visitor_events (
          visitor_id, user_id, event_type, path, country, region, city, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        visitorId,
        authenticatedUser?.id ?? null,
        eventType,
        path,
        geo.country,
        geo.region,
        geo.city,
        now,
      ),
  ]);

  const headers = new Headers({ "cache-control": "no-store" });
  if (!hasValidVisitorId) {
    headers.set("set-cookie", visitorCookie(request, visitorId));
  }
  return new Response(null, { status: 204, headers });
}

type AdminUserRow = {
  id: string;
  email: string;
  displayName: string;
  plan: string;
  status: string;
  emailVerified: number;
  createdAt: string;
  lastLoginAt: string;
  updatedAt: string;
};

async function handleAdminUsersRequest(
  request: Request,
  db: D1Database,
  authenticatedUser: SessionUser,
): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/api/admin/billing" && request.method === "GET") {
    const [orderStats, subscriptionStats, orders, subscriptions] = await Promise.all([
      db
        .prepare(
          `SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS paid,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) AS revenue
          FROM orders`,
        )
        .first<{ total: number; paid: number; pending: number; revenue: number }>(),
      db
        .prepare(
          `SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status IN ('active', 'trialing') THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN status = 'past_due' THEN 1 ELSE 0 END) AS pastDue,
            SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) AS canceled
          FROM subscriptions`,
        )
        .first<{ total: number; active: number; pastDue: number; canceled: number }>(),
      db
        .prepare(
          `SELECT
            orders.id,
            users.email,
            users.display_name AS displayName,
            orders.plan,
            orders.amount,
            orders.currency,
            orders.status,
            orders.created_at AS createdAt
          FROM orders
          JOIN users ON users.id = orders.user_id
          ORDER BY orders.created_at DESC
          LIMIT 50`,
        )
        .all<Record<string, unknown>>(),
      db
        .prepare(
          `SELECT
            subscriptions.id,
            users.email,
            users.display_name AS displayName,
            subscriptions.plan,
            subscriptions.status,
            subscriptions.current_period_end AS currentPeriodEnd,
            subscriptions.cancel_at_period_end AS cancelAtPeriodEnd,
            subscriptions.canceled_at AS canceledAt,
            subscriptions.updated_at AS updatedAt
          FROM subscriptions
          JOIN users ON users.id = subscriptions.user_id
          ORDER BY subscriptions.updated_at DESC
          LIMIT 50`,
        )
        .all<Record<string, unknown>>(),
    ]);

    return json(
      {
        ok: true,
        summary: {
          orders: orderStats?.total ?? 0,
          paidOrders: orderStats?.paid ?? 0,
          pendingOrders: orderStats?.pending ?? 0,
          revenue: orderStats?.revenue ?? 0,
          activeSubscriptions: subscriptionStats?.active ?? 0,
          pastDueSubscriptions: subscriptionStats?.pastDue ?? 0,
          canceledSubscriptions: subscriptionStats?.canceled ?? 0,
        },
        orders: orders.results ?? [],
        subscriptions: subscriptions.results ?? [],
      },
      200,
    );
  }

  if (url.pathname === "/api/admin/analytics" && request.method === "GET") {
    const requestedRange = Number.parseInt(
      url.searchParams.get("days") ?? "30",
      10,
    );
    const days = [7, 30, 90].includes(requestedRange) ? requestedRange : 30;
    const since = new Date(Date.now() - (days - 1) * 86_400_000);
    since.setUTCHours(0, 0, 0, 0);
    const sinceIso = since.toISOString();

    const [
      summary,
      newVisitors,
      trend,
      countries,
      topPages,
      sources,
      devices,
      recentVisitors,
    ] = await Promise.all([
      db
        .prepare(
          `SELECT
            COUNT(DISTINCT visitor_id) AS visitors,
            SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) AS pageViews,
            SUM(CASE WHEN event_type = 'download' THEN 1 ELSE 0 END) AS downloads,
            COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN user_id END) AS knownUsers
          FROM visitor_events
          WHERE created_at >= ?`,
        )
        .bind(sinceIso)
        .first<{
          visitors: number;
          pageViews: number;
          downloads: number;
          knownUsers: number;
        }>(),
      db
        .prepare(
          "SELECT COUNT(*) AS count FROM visitor_sessions WHERE first_seen_at >= ?",
        )
        .bind(sinceIso)
        .first<{ count: number }>(),
      db
        .prepare(
          `SELECT
            substr(created_at, 1, 10) AS day,
            COUNT(DISTINCT visitor_id) AS visitors,
            SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) AS pageViews
          FROM visitor_events
          WHERE created_at >= ?
          GROUP BY substr(created_at, 1, 10)
          ORDER BY day ASC`,
        )
        .bind(sinceIso)
        .all<{ day: string; visitors: number; pageViews: number }>(),
      db
        .prepare(
          `SELECT
            country,
            COUNT(DISTINCT visitor_id) AS visitors,
            COUNT(*) AS events
          FROM visitor_events
          WHERE created_at >= ? AND event_type = 'page_view'
          GROUP BY country
          ORDER BY visitors DESC
          LIMIT 12`,
        )
        .bind(sinceIso)
        .all<{ country: string; visitors: number; events: number }>(),
      db
        .prepare(
          `SELECT path, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors
          FROM visitor_events
          WHERE created_at >= ? AND event_type = 'page_view'
          GROUP BY path
          ORDER BY views DESC
          LIMIT 12`,
        )
        .bind(sinceIso)
        .all<{ path: string; views: number; visitors: number }>(),
      db
        .prepare(
          `SELECT source, COUNT(*) AS visitors
          FROM visitor_sessions
          WHERE last_seen_at >= ?
          GROUP BY source
          ORDER BY visitors DESC
          LIMIT 10`,
        )
        .bind(sinceIso)
        .all<{ source: string; visitors: number }>(),
      db
        .prepare(
          `SELECT device_type AS deviceType, COUNT(*) AS visitors
          FROM visitor_sessions
          WHERE last_seen_at >= ?
          GROUP BY device_type
          ORDER BY visitors DESC`,
        )
        .bind(sinceIso)
        .all<{ deviceType: string; visitors: number }>(),
      db
        .prepare(
          `SELECT
            visitor_sessions.id AS visitorId,
            visitor_sessions.user_id AS userId,
            users.email AS email,
            users.display_name AS displayName,
            visitor_sessions.last_seen_at AS lastSeenAt,
            visitor_sessions.first_seen_at AS firstSeenAt,
            visitor_sessions.landing_path AS landingPath,
            visitor_sessions.source AS source,
            visitor_sessions.country AS country,
            visitor_sessions.region AS region,
            visitor_sessions.city AS city,
            visitor_sessions.device_type AS deviceType,
            visitor_sessions.page_view_count AS pageViewCount
          FROM visitor_sessions
          LEFT JOIN users ON users.id = visitor_sessions.user_id
          WHERE visitor_sessions.last_seen_at >= ?
          ORDER BY visitor_sessions.last_seen_at DESC
          LIMIT 50`,
        )
        .bind(sinceIso)
        .all<{
          visitorId: string;
          userId: string | null;
          email: string | null;
          displayName: string | null;
          lastSeenAt: string;
          firstSeenAt: string;
          landingPath: string;
          source: string;
          country: string;
          region: string;
          city: string;
          deviceType: string;
          pageViewCount: number;
        }>(),
    ]);

    return json(
      {
        ok: true,
        days,
        summary: {
          visitors: summary?.visitors ?? 0,
          newVisitors: newVisitors?.count ?? 0,
          pageViews: summary?.pageViews ?? 0,
          downloads: summary?.downloads ?? 0,
          knownUsers: summary?.knownUsers ?? 0,
        },
        trend: trend.results ?? [],
        countries: countries.results ?? [],
        topPages: topPages.results ?? [],
        sources: sources.results ?? [],
        devices: devices.results ?? [],
        recentVisitors: recentVisitors.results ?? [],
      },
      200,
    );
  }

  if (url.pathname === "/api/admin/users.csv" && request.method === "GET") {
    const result = await db
      .prepare(
        `SELECT
          display_name AS displayName,
          email,
          plan,
          status,
          email_verified AS emailVerified,
          created_at AS createdAt,
          last_login_at AS lastLoginAt
        FROM users
        ORDER BY created_at DESC`,
      )
      .all<Omit<AdminUserRow, "id" | "updatedAt">>();
    const header = [
      "显示名称",
      "邮箱",
      "套餐",
      "状态",
      "邮箱已验证",
      "注册时间",
      "最近登录",
    ];
    const rows = (result.results ?? []).map((user) => [
      user.displayName,
      user.email,
      user.plan,
      user.status,
      user.emailVerified ? "是" : "否",
      user.createdAt,
      user.lastLoginAt,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    return new Response(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        "cache-control": "no-store",
        "content-disposition": `attachment; filename="baichengpu-users-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
        "content-type": "text/csv; charset=utf-8",
      },
    });
  }

  if (url.pathname === "/api/admin/users" && request.method === "GET") {
    const query = (url.searchParams.get("q") ?? "")
      .trim()
      .toLocaleLowerCase()
      .slice(0, 100);
    const status = url.searchParams.get("status") ?? "all";
    const plan = url.searchParams.get("plan") ?? "all";
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = 25;
    const where: string[] = [];
    const values: unknown[] = [];

    if (query) {
      where.push("(LOWER(email) LIKE ? OR LOWER(display_name) LIKE ?)");
      const pattern = `%${query}%`;
      values.push(pattern, pattern);
    }
    if (status === "active" || status === "disabled") {
      where.push("status = ?");
      values.push(status);
    }
    if (plan === "free" || plan === "pro") {
      where.push("plan = ?");
      values.push(plan);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const offset = (page - 1) * pageSize;

    const [usersResult, countResult, statsResult, trendResult] = await Promise.all([
      db
        .prepare(
          `SELECT
            id,
            email,
            display_name AS displayName,
            plan,
            status,
            email_verified AS emailVerified,
            created_at AS createdAt,
            last_login_at AS lastLoginAt,
            updated_at AS updatedAt
          FROM users
          ${whereSql}
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?`,
        )
        .bind(...values, pageSize, offset)
        .all<AdminUserRow>(),
      db
        .prepare(`SELECT COUNT(*) AS count FROM users ${whereSql}`)
        .bind(...values)
        .first<{ count: number }>(),
      db
        .prepare(
          `SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
            SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) AS disabled,
            SUM(CASE WHEN plan = 'pro' THEN 1 ELSE 0 END) AS pro,
            SUM(CASE WHEN substr(created_at, 1, 10) = date('now') THEN 1 ELSE 0 END) AS today
          FROM users`,
        )
        .first<{
          total: number;
          active: number;
          disabled: number;
          pro: number;
          today: number;
        }>(),
      db
        .prepare(
          `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count
          FROM users
          WHERE created_at >= datetime('now', '-29 days')
          GROUP BY substr(created_at, 1, 10)
          ORDER BY day ASC`,
        )
        .all<{ day: string; count: number }>(),
    ]);

    return json(
      {
        ok: true,
        users: usersResult.results ?? [],
        total: countResult?.count ?? 0,
        page,
        pageSize,
        stats: {
          total: statsResult?.total ?? 0,
          active: statsResult?.active ?? 0,
          disabled: statsResult?.disabled ?? 0,
          pro: statsResult?.pro ?? 0,
          today: statsResult?.today ?? 0,
        },
        trend: trendResult.results ?? [],
      },
      200,
    );
  }

  const userMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
  if (userMatch && request.method === "PATCH") {
    if (!isSameOrigin(request)) {
      return json({ ok: false, code: "INVALID_ORIGIN" }, 403);
    }
    const id = decodeURIComponent(userMatch[1]).slice(0, 80);
    const body = await readSmallJson(request);
    if (!body || !id) {
      return json({ ok: false, code: "INVALID_INPUT" }, 400);
    }
    const updates: string[] = [];
    const values: unknown[] = [];
    if (body.status === "active" || body.status === "disabled") {
      if (id === authenticatedUser.id && body.status === "disabled") {
        return json({ ok: false, code: "CANNOT_DISABLE_SELF" }, 400);
      }
      updates.push("status = ?");
      values.push(body.status);
    }
    if (body.plan === "free" || body.plan === "pro") {
      updates.push("plan = ?");
      values.push(body.plan);
    }
    if (!updates.length) {
      return json({ ok: false, code: "INVALID_INPUT" }, 400);
    }
    updates.push("updated_at = ?");
    values.push(new Date().toISOString(), id);
    const result = await db
      .prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();
    return json({ ok: true, changed: result.meta.changes > 0 }, 200);
  }

  return json({ ok: false, code: "NOT_FOUND" }, 404);
}

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (
      request.method === "POST" &&
      url.pathname === "/api/auth/password-reset/request"
    ) {
      try {
        return await handlePasswordResetRequest(request, env);
      } catch (reason) {
        console.error("[password-reset] REQUEST_FAILED", reason);
        return json({ ok: false, code: "STORE_FAILED" }, 500);
      }
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/auth/password-reset/confirm"
    ) {
      try {
        return await handlePasswordResetConfirm(request, env);
      } catch (reason) {
        console.error("[password-reset] CONFIRM_FAILED", reason);
        return json({ ok: false, code: "STORE_FAILED" }, 500);
      }
    }

    if (
      request.method === "POST" &&
      (url.pathname === "/api/auth/register" ||
        url.pathname === "/api/auth/login" ||
        url.pathname === "/api/auth/logout")
    ) {
      const action = url.pathname.slice("/api/auth/".length) as
        | "register"
        | "login"
        | "logout";
      try {
        return await handleAuthRequest(request, env.DB, action);
      } catch (reason) {
        console.error("[auth] STORE_FAILED", reason);
        return json({ ok: false, code: "STORE_FAILED" }, 500);
      }
    }

    const authenticatedUser = await readSessionUser(request, env.DB);
    const isAdmin =
      authenticatedUser !== null &&
      isAdminEmail(authenticatedUser.email, env.ADMIN_EMAILS);

    try {
      const paymentResponse = await handlePaymentRequest(
        request,
        env,
        authenticatedUser,
      );
      if (paymentResponse) return paymentResponse;
    } catch (reason) {
      console.error("[payments] REQUEST_FAILED", reason);
      return json({ ok: false, code: "PAYMENT_STORE_FAILED" }, 500);
    }

    if (url.pathname === "/api/analytics/event" && request.method === "POST") {
      try {
        return await handleAnalyticsEvent(request, env.DB, authenticatedUser);
      } catch (reason) {
        console.error("[analytics] STORE_FAILED", reason);
        return json({ ok: false, code: "STORE_FAILED" }, 500);
      }
    }

    if (url.pathname.startsWith("/api/admin/")) {
      if (!authenticatedUser) {
        return json({ ok: false, code: "AUTH_REQUIRED" }, 401);
      }
      if (!isAdmin) {
        return json({ ok: false, code: "ADMIN_REQUIRED" }, 403);
      }
      try {
        return await handleAdminUsersRequest(
          request,
          env.DB,
          authenticatedUser,
        );
      } catch (reason) {
        console.error("[admin] STORE_FAILED", reason);
        return json({ ok: false, code: "STORE_FAILED" }, 500);
      }
    }

    if (url.pathname.startsWith("/admin") && request.method === "GET") {
      const adminPagePath = normalizeAdminPagePath(url.pathname);
      const isDocumentRequest =
        request.headers.get("sec-fetch-dest") === "document";

      if (url.pathname.endsWith(".rsc") && isDocumentRequest) {
        return Response.redirect(new URL(adminPagePath, request.url), 302);
      }

      if (adminPagePath === "/admin/login") {
        if (isAdmin) {
          return Response.redirect(new URL("/admin", request.url), 302);
        }
      } else if (!authenticatedUser) {
        return Response.redirect(
          new URL(
            `/admin/login?return_to=${encodeURIComponent(safeAdminReturnPath(url.pathname))}`,
            request.url,
          ),
          302,
        );
      } else if (!isAdmin) {
        return Response.redirect(new URL("/account", request.url), 302);
      }
    }

    if (
      url.pathname === "/account" &&
      request.method === "GET" &&
      !authenticatedUser
    ) {
      return Response.redirect(
        new URL("/auth?mode=login&return_to=%2Faccount", request.url),
        302,
      );
    }

    if (url.pathname === "/api/account" && request.method === "GET") {
      return authenticatedUser
        ? json({ ok: true, account: authenticatedUser }, 200)
        : json({ ok: false, code: "AUTH_REQUIRED" }, 401);
    }

    if (url.pathname === "/api/client-error" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          code?: unknown;
          message?: unknown;
          phase?: unknown;
          stack?: unknown;
          version?: unknown;
        };
        const code =
          typeof body.code === "string" ? body.code.slice(0, 64) : "UNKNOWN";
        const message =
          typeof body.message === "string"
            ? body.message.replace(/[\r\n]+/g, " ").slice(0, 500)
            : "No message";
        const phase =
          typeof body.phase === "string" ? body.phase.slice(0, 100) : "unknown";
        const version =
          typeof body.version === "string"
            ? body.version.slice(0, 32)
            : "unknown";
        const stack =
          typeof body.stack === "string"
            ? body.stack.replace(/[\r\n]+/g, " ").slice(0, 1200)
            : "No stack";
        console.error(
          `[client-model-error] ${version} ${code} phase=${phase}: ${message} stack=${stack}`,
        );
      } catch {
        console.error("[client-model-error] INVALID_PAYLOAD");
      }
      return new Response(null, { status: 204 });
    }

    if (
      url.pathname === "/api/quality-feedback" &&
      request.method === "POST"
    ) {
      try {
        const body = (await request.json()) as {
          rating?: unknown;
          issues?: unknown;
          cleanupMode?: unknown;
          platform?: unknown;
          version?: unknown;
        };
        const rating =
          body.rating === "satisfied" || body.rating === "unsatisfied"
            ? body.rating
            : "unknown";
        const issues = Array.isArray(body.issues)
          ? body.issues
              .filter((issue): issue is string => typeof issue === "string")
              .slice(0, 8)
              .map((issue) => issue.slice(0, 40))
          : [];
        const cleanupMode =
          typeof body.cleanupMode === "string"
            ? body.cleanupMode.slice(0, 32)
            : "unknown";
        const platform =
          typeof body.platform === "string"
            ? body.platform.slice(0, 32)
            : "unknown";
        const version =
          typeof body.version === "string"
            ? body.version.slice(0, 32)
            : "unknown";
        console.log(
          `[quality-feedback] ${version} rating=${rating} cleanup=${cleanupMode} platform=${platform} issues=${issues.join(",") || "none"}`,
        );
      } catch {
        console.error("[quality-feedback] INVALID_PAYLOAD");
      }
      return new Response(null, { status: 204 });
    }

    if (url.pathname === "/api/pro-interest" && request.method === "POST") {
      const json = (value: unknown, status: number) =>
        Response.json(value, {
          status,
          headers: { "cache-control": "no-store" },
        });

      try {
        const body = (await request.json()) as {
          role?: unknown;
          monthlyVolume?: unknown;
          needs?: unknown;
          contactChannel?: unknown;
          contact?: unknown;
          note?: unknown;
          source?: unknown;
          website?: unknown;
        };

        if (typeof body.website === "string" && body.website.trim()) {
          return json({ ok: true }, 200);
        }

        const allowedRoles = new Set([
          "ecommerce",
          "new-media",
          "photography",
          "team-lead",
          "other",
        ]);
        const allowedVolumes = new Set([
          "1-20",
          "21-100",
          "101-500",
          "500+",
        ]);
        const allowedChannels = new Set(["wechat", "email"]);
        const role = typeof body.role === "string" ? body.role : "";
        const monthlyVolume =
          typeof body.monthlyVolume === "string" ? body.monthlyVolume : "";
        const contactChannel =
          typeof body.contactChannel === "string" ? body.contactChannel : "";
        const contact =
          typeof body.contact === "string"
            ? body.contact.trim().replace(/[\r\n]+/g, "").slice(0, 120)
            : "";
        const needs = Array.isArray(body.needs)
          ? body.needs
              .filter((need): need is string => typeof need === "string")
              .slice(0, 6)
              .map((need) => need.slice(0, 40))
          : [];
        const note =
          typeof body.note === "string"
            ? body.note.trim().replace(/\0/g, "").slice(0, 500)
            : "";
        const source =
          typeof body.source === "string"
            ? body.source.trim().slice(0, 60)
            : "pricing";

        if (
          !allowedRoles.has(role) ||
          !allowedVolumes.has(monthlyVolume) ||
          !allowedChannels.has(contactChannel) ||
          contact.length < 3
        ) {
          return json({ ok: false, code: "INVALID_INPUT" }, 400);
        }

        const now = new Date().toISOString();
        await env.DB.batch([
          env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS pro_interests (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              contact TEXT NOT NULL UNIQUE,
              contact_channel TEXT NOT NULL,
              role TEXT NOT NULL,
              monthly_volume TEXT NOT NULL,
              needs TEXT NOT NULL,
              note TEXT NOT NULL DEFAULT '',
              source TEXT NOT NULL DEFAULT 'pricing',
              status TEXT NOT NULL DEFAULT 'new',
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
          `),
          env.DB.prepare(
            "CREATE INDEX IF NOT EXISTS pro_interests_status_idx ON pro_interests (status, created_at)",
          ),
        ]);
        await env.DB.prepare(`
          INSERT INTO pro_interests (
            contact, contact_channel, role, monthly_volume, needs, note,
            source, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)
          ON CONFLICT(contact) DO UPDATE SET
            contact_channel = excluded.contact_channel,
            role = excluded.role,
            monthly_volume = excluded.monthly_volume,
            needs = excluded.needs,
            note = excluded.note,
            source = excluded.source,
            status = 'new',
            updated_at = excluded.updated_at
        `)
          .bind(
            contact,
            contactChannel,
            role,
            monthlyVolume,
            JSON.stringify(needs),
            note,
            source,
            now,
            now,
          )
          .run();

        console.log(
          `[pro-interest] role=${role} volume=${monthlyVolume} channel=${contactChannel} needs=${needs.length} source=${source}`,
        );
        return json({ ok: true }, 201);
      } catch (reason) {
        console.error("[pro-interest] STORE_FAILED", reason);
        return json({ ok: false, code: "STORE_FAILED" }, 500);
      }
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    const appHeaders = new Headers(request.headers);
    for (const header of Object.values(INTERNAL_USER_HEADERS)) {
      appHeaders.delete(header);
    }
    if (authenticatedUser) {
      appHeaders.set(INTERNAL_USER_HEADERS.id, authenticatedUser.id);
      appHeaders.set(INTERNAL_USER_HEADERS.email, authenticatedUser.email);
      appHeaders.set(
        INTERNAL_USER_HEADERS.name,
        encodeURIComponent(authenticatedUser.displayName),
      );
      appHeaders.set(INTERNAL_USER_HEADERS.admin, isAdmin ? "1" : "0");
      appHeaders.set(INTERNAL_USER_HEADERS.plan, authenticatedUser.plan || "free");
    }
    appHeaders.set(
      LOCALE_HEADER,
      /^\/zh(?:\/|$)/.test(url.pathname) ? "zh" : "en",
    );
    const appRequest = new Request(request, { headers: appHeaders });
    const response = await handler.fetch(appRequest, env, ctx);
    const headers = new Headers(response.headers);
    headers.set("Cross-Origin-Opener-Policy", "same-origin");
    headers.set("Cross-Origin-Embedder-Policy", "require-corp");
    headers.set("Cross-Origin-Resource-Policy", "same-origin");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

export default worker;
