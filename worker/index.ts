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

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

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
