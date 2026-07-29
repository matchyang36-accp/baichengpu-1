/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
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
};

type StoredCredential = SessionUser & {
  passwordHash: string | null;
  passwordSalt: string | null;
  passwordIterations: number | null;
  status: string;
};

const SESSION_COOKIE = "bcp_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD_ITERATIONS = 210_000;
const AUTH_BODY_LIMIT_BYTES = 16 * 1024;
const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000;
const AUTH_RATE_BLOCK_MS = 30 * 60 * 1000;
const AUTH_RATE_MAX_ATTEMPTS = 8;
const INTERNAL_USER_HEADERS = {
  id: "x-baichengpu-user-id",
  email: "x-baichengpu-user-email",
  name: "x-baichengpu-user-name",
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
        users.display_name AS displayName
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
    }
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
