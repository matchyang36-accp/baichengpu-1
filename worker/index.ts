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

const AUTH_EMAIL_HEADER = "oai-authenticated-user-email";
const AUTH_NAME_HEADER = "oai-authenticated-user-full-name";
const AUTH_NAME_ENCODING_HEADER =
  "oai-authenticated-user-full-name-encoding";

function readAuthenticatedUser(request: Request) {
  const rawEmail = request.headers.get(AUTH_EMAIL_HEADER)?.trim() ?? "";
  const email = rawEmail.toLocaleLowerCase().slice(0, 320);
  if (!email || !email.includes("@")) return null;

  const encodedName = request.headers.get(AUTH_NAME_HEADER);
  let displayName = email;
  if (
    encodedName &&
    request.headers.get(AUTH_NAME_ENCODING_HEADER) === "percent-encoded-utf-8"
  ) {
    try {
      displayName = decodeURIComponent(encodedName).trim().slice(0, 120) || email;
    } catch {
      displayName = email;
    }
  }

  return { email, displayName };
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/account" && request.method === "POST") {
      const user = readAuthenticatedUser(request);
      if (!user) {
        return Response.json(
          { ok: false, code: "AUTH_REQUIRED" },
          {
            status: 401,
            headers: { "cache-control": "no-store" },
          },
        );
      }

      try {
        const existing = await env.DB.prepare(
          "SELECT id FROM users WHERE email = ? LIMIT 1",
        )
          .bind(user.email)
          .first<{ id: string }>();
        const now = new Date().toISOString();
        const id = existing?.id ?? crypto.randomUUID();

        await env.DB.prepare(`
          INSERT INTO users (
            id, email, display_name, plan, status,
            created_at, last_login_at, updated_at
          ) VALUES (?, ?, ?, 'free', 'active', ?, ?, ?)
          ON CONFLICT(email) DO UPDATE SET
            display_name = excluded.display_name,
            last_login_at = excluded.last_login_at,
            updated_at = excluded.updated_at
        `)
          .bind(id, user.email, user.displayName, now, now, now)
          .run();

        return Response.json(
          {
            ok: true,
            created: !existing,
            account: {
              displayName: user.displayName,
              email: user.email,
              plan: "free",
            },
          },
          {
            status: existing ? 200 : 201,
            headers: { "cache-control": "no-store" },
          },
        );
      } catch (reason) {
        console.error("[account] STORE_FAILED", reason);
        return Response.json(
          { ok: false, code: "STORE_FAILED" },
          {
            status: 500,
            headers: { "cache-control": "no-store" },
          },
        );
      }
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

    const response = await handler.fetch(request, env, ctx);
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
