type WaitUntilContext = {
  waitUntil(promise: Promise<unknown>): void;
};

export type HttpAnalyticsPayload = {
  summary: {
    requests: number;
    successfulRequests: number;
    clientErrors: number;
    serverErrors: number;
    apiRequests: number;
    averageDurationMs: number;
  };
  trend: Array<{ day: string; requests: number; averageDurationMs: number }>;
  methods: Array<{ method: string; requests: number }>;
  statuses: Array<{ statusCode: number; requests: number }>;
  topPaths: Array<{ path: string; requests: number; averageDurationMs: number }>;
};

const STATIC_PATH_PREFIXES = [
  "/assets/",
  "/_next/",
  "/images/",
  "/models/",
  "/fonts/",
];

function safeErrorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message.slice(0, 300) : String(reason).slice(0, 300);
}

function normalizeRequestPath(pathname: string): string {
  if (STATIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return "/static/*";
  }
  if (/\.(?:avif|css|gif|ico|jpe?g|js|json|map|mjs|onnx|png|svg|wasm|webp|woff2?)$/i.test(pathname)) {
    return "/static/*";
  }

  const normalized = pathname
    .split("/")
    .map((segment) => {
      if (!segment) return segment;
      if (/^\d+$/.test(segment)) return ":id";
      if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(segment)) return ":id";
      if (segment.length > 80 || /%40/i.test(segment)) return ":value";
      return segment;
    })
    .join("/");

  return normalized.slice(0, 240) || "/";
}

function shouldRecordRequest(request: Request): boolean {
  if (!request.headers.has("cf-ray")) return false;
  const pathname = new URL(request.url).pathname;
  return !pathname.startsWith("/admin") && !pathname.startsWith("/api/admin/");
}

async function writeHttpRequestStat(
  request: Request,
  db: D1Database,
  statusCode: number,
  durationMs: number,
): Promise<void> {
  const url = new URL(request.url);
  const day = new Date().toISOString().slice(0, 10);
  const path = normalizeRequestPath(url.pathname);
  const method = request.method.toUpperCase().slice(0, 12);
  const safeStatusCode = Number.isInteger(statusCode) ? Math.min(599, Math.max(100, statusCode)) : 500;
  const safeDurationMs = Math.min(3_600_000, Math.max(0, Math.round(durationMs)));

  await db
    .prepare(
      `INSERT INTO http_request_daily (
        day, path, method, status_code, request_count, total_duration_ms, max_duration_ms
      ) VALUES (?, ?, ?, ?, 1, ?, ?)
      ON CONFLICT(day, path, method, status_code) DO UPDATE SET
        request_count = http_request_daily.request_count + 1,
        total_duration_ms = http_request_daily.total_duration_ms + excluded.total_duration_ms,
        max_duration_ms = MAX(http_request_daily.max_duration_ms, excluded.max_duration_ms)`,
    )
    .bind(day, path, method, safeStatusCode, safeDurationMs, safeDurationMs)
    .run();
}

export function scheduleHttpRequestStat(
  request: Request,
  db: D1Database,
  ctx: WaitUntilContext,
  statusCode: number,
  startedAt: number,
): void {
  if (!shouldRecordRequest(request)) return;
  const path = normalizeRequestPath(new URL(request.url).pathname);
  const operation = writeHttpRequestStat(
    request,
    db,
    statusCode,
    Date.now() - startedAt,
  ).catch((reason: unknown) => {
    console.error("[http-analytics] STORE_FAILED", {
      path,
      statusCode,
      reason: safeErrorMessage(reason),
    });
  });
  ctx.waitUntil(operation);
}

export async function loadHttpAnalytics(
  db: D1Database,
  sinceIso: string,
): Promise<HttpAnalyticsPayload> {
  const sinceDay = sinceIso.slice(0, 10);
  const [summary, trend, methods, statuses, topPaths] = await Promise.all([
    db
      .prepare(
        `SELECT
          COALESCE(SUM(request_count), 0) AS requests,
          COALESCE(SUM(CASE WHEN status_code BETWEEN 200 AND 399 THEN request_count ELSE 0 END), 0) AS successfulRequests,
          COALESCE(SUM(CASE WHEN status_code BETWEEN 400 AND 499 THEN request_count ELSE 0 END), 0) AS clientErrors,
          COALESCE(SUM(CASE WHEN status_code >= 500 THEN request_count ELSE 0 END), 0) AS serverErrors,
          COALESCE(SUM(CASE WHEN path LIKE '/api/%' THEN request_count ELSE 0 END), 0) AS apiRequests,
          COALESCE(ROUND(1.0 * SUM(total_duration_ms) / NULLIF(SUM(request_count), 0)), 0) AS averageDurationMs
        FROM http_request_daily
        WHERE day >= ?`,
      )
      .bind(sinceDay)
      .first<HttpAnalyticsPayload["summary"]>(),
    db
      .prepare(
        `SELECT
          day,
          SUM(request_count) AS requests,
          COALESCE(ROUND(1.0 * SUM(total_duration_ms) / NULLIF(SUM(request_count), 0)), 0) AS averageDurationMs
        FROM http_request_daily
        WHERE day >= ?
        GROUP BY day
        ORDER BY day ASC`,
      )
      .bind(sinceDay)
      .all<HttpAnalyticsPayload["trend"][number]>(),
    db
      .prepare(
        `SELECT method, SUM(request_count) AS requests
        FROM http_request_daily
        WHERE day >= ?
        GROUP BY method
        ORDER BY requests DESC`,
      )
      .bind(sinceDay)
      .all<HttpAnalyticsPayload["methods"][number]>(),
    db
      .prepare(
        `SELECT status_code AS statusCode, SUM(request_count) AS requests
        FROM http_request_daily
        WHERE day >= ?
        GROUP BY status_code
        ORDER BY status_code ASC`,
      )
      .bind(sinceDay)
      .all<HttpAnalyticsPayload["statuses"][number]>(),
    db
      .prepare(
        `SELECT
          path,
          SUM(request_count) AS requests,
          COALESCE(ROUND(1.0 * SUM(total_duration_ms) / NULLIF(SUM(request_count), 0)), 0) AS averageDurationMs
        FROM http_request_daily
        WHERE day >= ?
        GROUP BY path
        ORDER BY requests DESC
        LIMIT 12`,
      )
      .bind(sinceDay)
      .all<HttpAnalyticsPayload["topPaths"][number]>(),
  ]);

  return {
    summary: {
      requests: summary?.requests ?? 0,
      successfulRequests: summary?.successfulRequests ?? 0,
      clientErrors: summary?.clientErrors ?? 0,
      serverErrors: summary?.serverErrors ?? 0,
      apiRequests: summary?.apiRequests ?? 0,
      averageDurationMs: summary?.averageDurationMs ?? 0,
    },
    trend: trend.results ?? [],
    methods: methods.results ?? [],
    statuses: statuses.results ?? [],
    topPaths: topPaths.results ?? [],
  };
}
