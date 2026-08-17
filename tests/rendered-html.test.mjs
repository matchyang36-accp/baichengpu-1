import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import Stripe from "stripe";

const scheduledArticlesDirectory = new URL("../app/blog/scheduled-articles/", import.meta.url);
const scheduledArticleManifest = (
  await Promise.all(
    (await readdir(scheduledArticlesDirectory))
      .filter((name) => name.endsWith(".json"))
      .map(async (name) => JSON.parse(await readFile(new URL(name, scheduledArticlesDirectory), "utf8"))),
  )
).toSorted((left, right) => Date.parse(left.publishedAt) - Date.parse(right.publishedAt));

test("keeps the complete editorial schedule deterministic", () => {
  assert.equal(scheduledArticleManifest.length, 60);
  assert.equal(new Set(scheduledArticleManifest.map(({ id }) => id)).size, 60);
  const publicationTimes = scheduledArticleManifest.map(({ publishedAt }) => Date.parse(publishedAt));
  assert.ok(publicationTimes.every(Number.isFinite));
  const dailyCounts = scheduledArticleManifest.reduce((counts, { date }) => {
    counts[date] = (counts[date] ?? 0) + 1;
    return counts;
  }, {});
  assert.equal(Object.keys(dailyCounts).length, 30);
  assert.ok(Object.values(dailyCounts).every((count) => count === 2));
  assert.equal(scheduledArticleManifest[0].publishedAt, "2026-08-16T01:00:00.000Z");
  assert.equal(scheduledArticleManifest[9].publishedAt, "2026-08-20T09:00:00.000Z");
  assert.equal(scheduledArticleManifest[10].publishedAt, "2026-08-21T01:00:00.000Z");
  assert.equal(scheduledArticleManifest.at(-1).publishedAt, "2026-09-14T09:00:00.000Z");
  assert.deepEqual(publicationTimes, publicationTimes.toSorted((a, b) => a - b));
});

test("schedules the second English series twice daily for 25 days", () => {
  const secondSeries = scheduledArticleManifest.slice(10);
  assert.equal(secondSeries.length, 50);
  const expectedDates = Array.from({ length: 25 }, (_, index) => {
    const value = new Date(Date.UTC(2026, 7, 21 + index));
    return value.toISOString().slice(0, 10);
  });
  assert.deepEqual([...new Set(secondSeries.map(({ date }) => date))], expectedDates);
  for (const expectedDate of expectedDates) {
    const dailyArticles = secondSeries.filter(({ date }) => date === expectedDate);
    assert.equal(dailyArticles.length, 2);
    assert.deepEqual(
      dailyArticles.map(({ publishedAt }) => publishedAt.slice(11, 16)),
      ["01:00", "09:00"],
    );
  }
});

test("does not expose an editorial article before its publication time", async (context) => {
  const firstArticle = scheduledArticleManifest.find(
    ({ publishedAt }) => Date.now() < Date.parse(publishedAt),
  );
  if (!firstArticle) {
    context.skip("All scheduled editorial articles are already published.");
    return;
  }

  const [articleResponse, blogResponse, sitemapResponse] = await Promise.all([
    render(`/en/blog/${firstArticle.id}`),
    render("/en/blog"),
    render("/sitemap.xml"),
  ]);
  assert.equal(articleResponse.status, 404);
  const [blogHtml, sitemapXml] = await Promise.all([
    blogResponse.text(),
    sitemapResponse.text(),
  ]);
  assert.doesNotMatch(blogHtml, new RegExp(firstArticle.id));
  assert.doesNotMatch(sitemapXml, new RegExp(firstArticle.id));
});

async function render(
  pathname = "/",
  requestHeaders = {},
  db = {},
  envOverrides = {},
) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "test",
    `${process.pid}-${Date.now()}-${pathname}`,
  );
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html", ...requestHeaders },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
      DB: db,
      ...envOverrides,
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

async function loadWorker(label) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${label}`);
  return (await import(workerUrl.href)).default;
}

test("server-renders the product homepage", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<title>Free AI Background Remover for Product Photos \| edit-photo<\/title>/);
  assert.match(html, /AI Background Remover for/);
  assert.match(html, /local processing/);
  assert.match(html, /Watch the background disappear/);
  assert.match(html, /\/images\/demo\/tomato-cutout-demo\.webp/);
  assert.match(html, /\/images\/demo\/tomato-cutout-result\.webp/);
  assert.match(html, /Language/);
  assert.match(html, /href="\/en\/batch"/);
  assert.match(html, /href="\/en\/pricing"/);
  assert.match(html, /href="\/en\/privacy"/);
  assert.match(html, /Sign up free/);
  assert.match(html, /Sign in/);
  assert.match(html, /Admin sign-in/);
  assert.match(html, /"@type":"SoftwareApplication"/);
  assert.match(html, /"@type":"Organization"/);
  assert.match(html, /What is a local AI background remover/);
  assert.match(html, /Amazon listings/);
  assert.match(html, /Background removal FAQ/);
  assert.match(html, /\/admin\/login\?return_to=%2Fadmin/);
  assert.doesNotMatch(html, /codex-preview|Building your site/);
});

test("renders locale-prefixed English and Chinese homepages", async () => {
  const [englishResponse, chineseResponse] = await Promise.all([
    render("/en"),
    render("/zh"),
  ]);
  assert.equal(englishResponse.status, 200);
  assert.equal(chineseResponse.status, 200);

  const [englishHtml, chineseHtml] = await Promise.all([
    englishResponse.text(),
    chineseResponse.text(),
  ]);
  assert.match(englishHtml, /<html lang="en">/);
  assert.match(englishHtml, /AI Background Remover for/);
  assert.match(englishHtml, /Real cutout preview/);
  assert.match(chineseHtml, /<html lang="zh-CN">/);
  assert.match(chineseHtml, /免费 AI 抠图工具/);
  assert.match(chineseHtml, /\/images\/demo\/tomato-cutout-demo\.webp/);
  assert.match(englishHtml, /href="\/en\/blog"/);
  assert.match(chineseHtml, /href="\/zh\/batch"/);
  assert.match(chineseHtml, /href="\/zh\/blog"/);
});

test("serves stable SEO discovery and locale metadata", async () => {
  const [robotsResponse, sitemapResponse, pricingResponse] = await Promise.all([
    render("/robots.txt"),
    render("/sitemap.xml"),
    render("/en/pricing"),
  ]);

  assert.equal(robotsResponse.status, 200);
  assert.equal(sitemapResponse.status, 200);
  assert.equal(pricingResponse.status, 200);

  const [robotsText, sitemapXml, pricingHtml] = await Promise.all([
    robotsResponse.text(),
    sitemapResponse.text(),
    pricingResponse.text(),
  ]);

  assert.match(robotsText, /Disallow: \/admin\//);
  assert.match(robotsText, /Sitemap: https:\/\/edit-photo\.com\/sitemap\.xml/);
  assert.match(sitemapXml, /https:\/\/edit-photo\.com\/en\/pricing/);
  assert.match(sitemapXml, /https:\/\/edit-photo\.com\/zh\/pricing/);
  assert.match(sitemapXml, /https:\/\/edit-photo\.com\/en\/disclaimer/);
  assert.match(sitemapXml, /https:\/\/edit-photo\.com\/en\/blog\/product-photo-tips/);
  assert.match(sitemapXml, /https:\/\/edit-photo\.com\/zh\/blog\/ecommerce-image-specs/);
  assert.doesNotMatch(sitemapXml, /\/auth|\/admin|\/account/);
  assert.match(pricingHtml, /rel="canonical" href="https:\/\/edit-photo\.com\/en\/pricing"/);
  assert.match(pricingHtml, /hrefLang="zh-CN" href="https:\/\/edit-photo\.com\/zh\/pricing"/);
  assert.match(pricingHtml, /hrefLang="x-default" href="https:\/\/edit-photo\.com\/en\/pricing"/);
  assert.match(pricingHtml, /"@type":"FAQPage"/);
});

test("renders localized article bodies with discoverable SEO metadata", async () => {
  const [englishResponse, chineseResponse] = await Promise.all([
    render("/en/blog/ecommerce-image-specs"),
    render("/zh/blog/ecommerce-image-specs"),
  ]);

  assert.equal(englishResponse.status, 200);
  assert.equal(chineseResponse.status, 200);

  const [englishHtml, chineseHtml] = await Promise.all([
    englishResponse.text(),
    chineseResponse.text(),
  ]);

  assert.match(englishHtml, /A safer cross-platform master workflow/);
  assert.match(englishHtml, /Amazon Seller Central product-image guidance/);
  assert.match(englishHtml, /"@type":"Article"/);
  assert.match(
    englishHtml,
    /rel="canonical" href="https:\/\/edit-photo\.com\/en\/blog\/ecommerce-image-specs"/,
  );
  assert.match(
    englishHtml,
    /hrefLang="zh-CN" href="https:\/\/edit-photo\.com\/zh\/blog\/ecommerce-image-specs"/,
  );
  assert.match(chineseHtml, /发布前核对/);
  assert.match(chineseHtml, /淘宝规则中心/);
});

test("renders signed-in account navigation and protected account page", async () => {
  const authenticatedHeaders = {
    cookie: "bcp_session=test-session-token",
  };
  const sessionDb = {
    prepare(sql) {
      assert.match(sql, /FROM sessions/);
      return {
        bind() {
          return {
            async first() {
              return {
                id: "user-1",
                email: "seller@example.com",
                displayName: "电商运营小白",
              };
            },
          };
        },
      };
    },
  };
  const [homeResponse, accountResponse] = await Promise.all([
    render("/", authenticatedHeaders, sessionDb),
    render("/account", authenticatedHeaders, sessionDb),
  ]);

  assert.equal(homeResponse.status, 200);
  assert.equal(accountResponse.status, 200);

  const [homeHtml, accountHtml] = await Promise.all([
    homeResponse.text(),
    accountResponse.text(),
  ]);
  assert.match(homeHtml, /My account/);
  assert.match(accountHtml, /账户中心/);
  assert.match(accountHtml, /电商运营小白/);
  assert.match(accountHtml, /seller@example\.com/);
  assert.match(accountHtml, /退出登录/);
});

test("redirects anonymous visitors to the independent sign-in flow", async () => {
  const response = await render("/account");
  assert.equal(response.status, 302);
  assert.equal(
    response.headers.get("location"),
    "http://localhost/auth?mode=login&return_to=%2Faccount",
  );
});

test("protects the user administration page with an admin email allowlist", async () => {
  const anonymousHomeResponse = await render("/admin");
  assert.equal(anonymousHomeResponse.status, 302);
  assert.equal(
    anonymousHomeResponse.headers.get("location"),
    "http://localhost/admin/login?return_to=%2Fadmin",
  );

  const anonymousResponse = await render("/admin/users");
  assert.equal(anonymousResponse.status, 302);
  assert.equal(
    anonymousResponse.headers.get("location"),
    "http://localhost/admin/login?return_to=%2Fadmin%2Fusers",
  );

  const anonymousRscResponse = await render("/admin/users.rsc?_rsc=test");
  assert.equal(anonymousRscResponse.status, 302);
  assert.equal(
    anonymousRscResponse.headers.get("location"),
    "http://localhost/admin/login?return_to=%2Fadmin%2Fusers",
  );

  const directRscDocumentResponse = await render(
    "/admin/users.rsc?_rsc=test",
    { "sec-fetch-dest": "document" },
  );
  assert.equal(directRscDocumentResponse.status, 302);
  assert.equal(
    directRscDocumentResponse.headers.get("location"),
    "http://localhost/admin/users",
  );

  const loginResponse = await render("/admin/login");
  assert.equal(loginResponse.status, 200);
  const loginHtml = await loginResponse.text();
  assert.match(loginHtml, /登录管理后台/);
  assert.match(loginHtml, /644373212@qq\.com/);
  assert.match(loginHtml, /忘记管理员密码/);
  assert.match(
    loginHtml,
    /href="\/zh\/forgot-password\?source=admin"/,
  );
  assert.doesNotMatch(loginHtml, /免费注册/);

  const authenticatedHeaders = {
    cookie: "bcp_session=admin-session-token",
  };
  const sessionDb = {
    prepare(sql) {
      assert.match(sql, /FROM sessions/);
      return {
        bind() {
          return {
            async first() {
              return {
                id: "admin-1",
                email: "admin@example.com",
                displayName: "Admin",
              };
            },
          };
        },
      };
    },
  };
  const nonAdminResponse = await render(
    "/admin/users",
    authenticatedHeaders,
    sessionDb,
  );
  assert.equal(nonAdminResponse.status, 302);
  assert.equal(nonAdminResponse.headers.get("location"), "http://localhost/account");

  const adminResponse = await render(
    "/admin/users",
    authenticatedHeaders,
    sessionDb,
    { ADMIN_EMAILS: "admin@example.com" },
  );
  assert.equal(adminResponse.status, 200);
  const html = await adminResponse.text();
  assert.match(html, /用户管理/);
  assert.match(html, /admin@example\.com/);
  assert.match(html, /导出 CSV/);

  const adminHomeResponse = await render(
    "/admin",
    authenticatedHeaders,
    sessionDb,
    { ADMIN_EMAILS: "admin@example.com" },
  );
  assert.equal(adminHomeResponse.status, 200);
  const adminHomeHtml = await adminHomeResponse.text();
  assert.match(adminHomeHtml, /管理首页/);
  assert.match(adminHomeHtml, /用户分析/);
  assert.match(adminHomeHtml, /用户管理/);
  assert.match(adminHomeHtml, /收费观察/);
  assert.match(adminHomeHtml, /href="\/admin\/analytics"/);
  assert.match(adminHomeHtml, /href="\/admin\/users"/);
  assert.match(adminHomeHtml, /href="\/admin\/billing"/);

  const analyticsResponse = await render(
    "/admin/analytics",
    authenticatedHeaders,
    sessionDb,
    { ADMIN_EMAILS: "admin@example.com" },
  );
  assert.equal(analyticsResponse.status, 200);
  const analyticsHtml = await analyticsResponse.text();
  assert.match(analyticsHtml, /访问分析/);
  assert.match(analyticsHtml, /HTTP 请求统计/);
  assert.match(analyticsHtml, /最近访客/);

  const billingResponse = await render(
    "/admin/billing",
    authenticatedHeaders,
    sessionDb,
    { ADMIN_EMAILS: "admin@example.com" },
  );
  assert.equal(billingResponse.status, 200);
  const billingHtml = await billingResponse.text();
  assert.match(billingHtml, /订单与订阅/);
  assert.match(billingHtml, /最近订单/);
});

test("returns billing summaries only to an authenticated administrator", async () => {
  const worker = await loadWorker("admin-billing");
  const db = {
    prepare(sql) {
      const statement = {
        bind() { return statement; },
        async first() {
          if (/FROM sessions/.test(sql)) return { id: "admin-1", email: "admin@example.com", displayName: "Admin", plan: "free" };
          if (/FROM orders/.test(sql)) return { total: 2, paid: 1, pending: 1, revenue: 3900 };
          if (/FROM subscriptions/.test(sql)) return { total: 1, active: 1, pastDue: 0, canceled: 0 };
          return null;
        },
        async all() {
          if (/FROM orders/.test(sql)) return { results: [{ id: 1, email: "buyer@example.com", displayName: "Buyer", plan: "pro", amount: 3900, currency: "cny", status: "completed", createdAt: "2026-08-13T00:00:00.000Z" }] };
          if (/FROM subscriptions/.test(sql)) return { results: [{ id: 1, email: "buyer@example.com", displayName: "Buyer", plan: "pro", status: "active", currentPeriodEnd: "2026-09-13T00:00:00.000Z", cancelAtPeriodEnd: 0, canceledAt: null, updatedAt: "2026-08-13T00:00:00.000Z" }] };
          return { results: [] };
        },
      };
      return statement;
    },
  };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const assets = { fetch: async () => new Response("Not found", { status: 404 }) };
  const anonymous = await worker.fetch(new Request("http://localhost/api/admin/billing"), { ASSETS: assets, DB: db, ADMIN_EMAILS: "admin@example.com" }, ctx);
  assert.equal(anonymous.status, 401);
  const response = await worker.fetch(new Request("http://localhost/api/admin/billing", { headers: { cookie: "bcp_session=admin-session-token" } }), { ASSETS: assets, DB: db, ADMIN_EMAILS: "admin@example.com" }, ctx);
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.deepEqual(payload.summary, { orders: 2, paidOrders: 1, pendingOrders: 1, revenue: 3900, activeSubscriptions: 1, pastDueSubscriptions: 0, canceledSubscriptions: 0 });
  assert.equal(payload.orders[0].email, "buyer@example.com");
  assert.equal("stripeCustomerId" in payload.subscriptions[0], false);
});

test("returns safe user data from the admin API", async () => {
  const worker = await loadWorker("admin-users");
  const db = {
    prepare(sql) {
      const statement = {
        bind() {
          return statement;
        },
        async first() {
          if (/FROM sessions/.test(sql)) {
            return {
              id: "admin-1",
              email: "admin@example.com",
              displayName: "Admin",
            };
          }
          if (/COUNT\(\*\) AS count/.test(sql)) return { count: 1 };
          if (/COUNT\(\*\) AS total/.test(sql)) {
            return { total: 1, active: 1, disabled: 0, pro: 0, today: 1 };
          }
          return null;
        },
        async all() {
          if (/GROUP BY substr/.test(sql)) {
            return { results: [{ day: "2026-07-29", count: 1 }] };
          }
          return {
            results: [
              {
                id: "user-1",
                email: "seller@example.com",
                displayName: "Seller",
                plan: "free",
                status: "active",
                emailVerified: 0,
                createdAt: "2026-07-29T10:00:00.000Z",
                lastLoginAt: "2026-07-29T10:00:00.000Z",
                updatedAt: "2026-07-29T10:00:00.000Z",
              },
            ],
          };
        },
      };
      return statement;
    },
  };
  const response = await worker.fetch(
    new Request("http://localhost/api/admin/users", {
      headers: { cookie: "bcp_session=admin-session-token" },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      DB: db,
      ADMIN_EMAILS: "admin@example.com",
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.ok, true);
  assert.equal(payload.users[0].email, "seller@example.com");
  assert.equal("passwordHash" in payload.users[0], false);
  assert.equal("passwordSalt" in payload.users[0], false);
});

test("server-renders the independent registration page", async () => {
  const [registerResponse, loginResponse] = await Promise.all([
    render("/auth?mode=register&return_to=%2Faccount"),
    render("/en/auth?mode=login&return_to=%2Fen%2Faccount"),
  ]);
  assert.equal(registerResponse.status, 200);
  assert.equal(loginResponse.status, 200);
  const [registerHtml, loginHtml] = await Promise.all([
    registerResponse.text(),
    loginResponse.text(),
  ]);
  assert.match(registerHtml, /Create account/);
  assert.match(registerHtml, /Sign up free/);
  assert.match(registerHtml, /Originals and results never uploaded/);
  assert.match(loginHtml, /Forgot password\?/);
});

test("server-renders the Chinese email verification password reset page", async () => {
  const response = await render("/zh/forgot-password");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /忘记密码/);
  assert.match(html, /发送验证码/);
  assert.match(html, /验证码 10 分钟后自动失效/);
});

test("server-renders the English email verification password reset page", async () => {
  const response = await render("/en/forgot-password");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Forgot password/);
  assert.match(html, /Send verification code/);
  assert.match(html, /verification code expires after 10 minutes/);
});

test("resets a password with a one-time emailed code and revokes sessions", async () => {
  const worker = await loadWorker("password-reset");
  const executed = [];
  let resetRecord = null;
  let deliveredCode = "";
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    if (String(input) === "https://api.resend.com/emails") {
      const email = JSON.parse(init.body);
      deliveredCode = email.text.match(/(\d{6})/)?.[1] ?? "";
      return Response.json({ id: "email-1" }, { status: 200 });
    }
    return nativeFetch(input, init);
  };

  const statementFor = (sql, values = []) => ({
    async first() {
      if (/SELECT id, display_name AS displayName FROM users/.test(sql)) {
        return { id: "user-1", displayName: "Seller" };
      }
      if (/COUNT\(\*\) AS count[\s\S]*password_reset_codes/.test(sql)) {
        return { count: 0 };
      }
      if (/FROM auth_rate_limits/.test(sql)) return null;
      if (/FROM password_reset_codes[\s\S]*INNER JOIN users/.test(sql)) {
        return resetRecord;
      }
      return null;
    },
    async run() {
      executed.push({ sql, values });
      if (/INSERT INTO password_reset_codes/.test(sql)) {
        resetRecord = {
          id: values[0],
          userId: values[1],
          codeHash: values[2],
          codeSalt: values[3],
          codeIterations: values[4],
          attempts: 0,
        };
      }
      return { success: true, meta: { changes: 1 } };
    },
  });
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return statementFor(sql, values);
        },
      };
    },
    async batch(statements) {
      for (const statement of statements) await statement.run();
      return [];
    },
  };
  const env = {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    DB: db,
    RESEND_API_KEY: "test-key",
    PASSWORD_RESET_FROM: "白橙铺 <no-reply@send.edit-photo.com>",
  };
  const ctx = { waitUntil() {}, passThroughOnException() {} };

  try {
    const requestResponse = await worker.fetch(
      new Request("http://localhost/api/auth/password-reset/request", {
        method: "POST",
        headers: { origin: "http://localhost", "content-type": "application/json" },
        body: JSON.stringify({ email: "seller@example.com" }),
      }),
      env,
      ctx,
    );
    assert.equal(requestResponse.status, 200);
    assert.equal(deliveredCode.length, 6);
    assert.ok(resetRecord);
    assert.notEqual(resetRecord.codeHash, deliveredCode);

    const confirmResponse = await worker.fetch(
      new Request("http://localhost/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { origin: "http://localhost", "content-type": "application/json" },
        body: JSON.stringify({
          email: "seller@example.com",
          code: deliveredCode,
          password: "NewSeller2026!",
        }),
      }),
      env,
      ctx,
    );
    assert.equal(confirmResponse.status, 200);
    assert.deepEqual(await confirmResponse.json(), { ok: true });
    assert.ok(executed.some(({ sql }) => /UPDATE users SET/.test(sql)));
    assert.ok(executed.some(({ sql }) => /DELETE FROM sessions WHERE user_id/.test(sql)));
  } finally {
    globalThis.fetch = nativeFetch;
  }
});

test("server-renders the professional plan and privacy pages", async () => {
  const [pricingResponse, zhPricingResponse, privacyResponse, zhPrivacyResponse] = await Promise.all([
    render("/pricing"),
    render("/zh/pricing"),
    render("/privacy"),
    render("/zh/privacy"),
  ]);
  assert.equal(pricingResponse.status, 200);
  assert.equal(zhPricingResponse.status, 200);
  assert.equal(privacyResponse.status, 200);
  assert.equal(zhPrivacyResponse.status, 200);

  const [pricingHtml, zhPricingHtml, privacyHtml, zhPrivacyHtml] = await Promise.all([
    pricingResponse.text(),
    zhPricingResponse.text(),
    privacyResponse.text(),
    zhPrivacyResponse.text(),
  ]);

  assert.match(pricingHtml, /Pro beta/);
  assert.match(pricingHtml, /¥39/);
  assert.match(pricingHtml, /Get Pro/);
  assert.match(pricingHtml, /¥199/);
  assert.match(pricingHtml, /What to know before you start/);
  assert.match(pricingHtml, /Submit beta application/);

  assert.match(zhPricingHtml, /专业版/);
  assert.match(zhPricingHtml, /升级专业版/);
  assert.match(zhPricingHtml, /团队版/);
  assert.match(zhPricingHtml, /常见问题/);
  assert.match(zhPricingHtml, /提交内测申请/);

  assert.match(privacyHtml, /Your product images stay on your device/);
  assert.match(privacyHtml, /never uploaded to our servers/);
  assert.match(privacyHtml, /Model files &amp; browser cache/);
  assert.match(privacyHtml, /never stores your raw IP address/);
  assert.match(privacyHtml, /Cookies &amp; third-party ads/);

  assert.match(zhPrivacyHtml, /你的商品图片，留在你的设备里/);
  assert.match(zhPrivacyHtml, /原图和生成结果不会上传/);
  assert.match(zhPrivacyHtml, /模型文件与浏览器缓存/);
  assert.match(zhPrivacyHtml, /不会保存你的原始 IP 地址/);
  assert.match(zhPrivacyHtml, /专业版内测申请/);
});

test("server-renders localized disclaimers with canonical metadata", async () => {
  const [englishResponse, chineseResponse] = await Promise.all([
    render("/en/disclaimer"),
    render("/zh/disclaimer"),
  ]);
  assert.equal(englishResponse.status, 200);
  assert.equal(chineseResponse.status, 200);

  const [englishHtml, chineseHtml] = await Promise.all([
    englishResponse.text(),
    chineseResponse.text(),
  ]);
  assert.match(englishHtml, /No guarantee of results/);
  assert.match(englishHtml, /Provided &quot;as is&quot;/);
  assert.match(englishHtml, /rel="canonical" href="https:\/\/edit-photo\.com\/en\/disclaimer"/);
  assert.match(chineseHtml, /结果不保证/);
  assert.match(chineseHtml, /内容版权/);
});

test("stores privacy-aware anonymous analytics without a raw IP", async () => {
  const worker = await loadWorker("analytics-event");
  const executed = [];
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async run() {
              executed.push({ sql, values });
              return { success: true };
            },
          };
        },
      };
    },
    async batch(statements) {
      for (const statement of statements) await statement.run();
      return [];
    },
  };
  const response = await worker.fetch(
    new Request("http://localhost/api/analytics/event", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
        "user-agent": "Mozilla/5.0 Desktop",
        "cf-connecting-ip": "203.0.113.10",
      },
      body: JSON.stringify({
        eventType: "page_view",
        path: "/pricing?campaign=test",
        referrer: "https://example.com/article",
      }),
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      DB: db,
    },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 204);
  assert.match(response.headers.get("set-cookie") ?? "", /bcp_visitor=/);
  assert.equal(executed.length, 2);
  assert.match(executed[0].sql, /INSERT INTO visitor_sessions/);
  assert.match(executed[1].sql, /INSERT INTO visitor_events/);
  assert.equal(executed.flatMap((entry) => entry.values).includes("203.0.113.10"), false);
  assert.equal(executed[1].values[3], "/pricing");

  const optedOutResponse = await worker.fetch(
    new Request("http://localhost/api/analytics/event", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
        "sec-gpc": "1",
      },
      body: JSON.stringify({ eventType: "page_view", path: "/" }),
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, DB: db },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(optedOutResponse.status, 204);
  assert.equal(executed.length, 2);
});

test("accepts and stores a valid professional plan application", async () => {
  const worker = await loadWorker("pro-interest");
  const executed = [];
  const statement = (sql) => ({
    bind(...values) {
      return {
        async run() {
          executed.push({ sql, values });
          return { success: true };
        },
      };
    },
    async run() {
      executed.push({ sql, values: [] });
      return { success: true };
    },
  });
  const response = await worker.fetch(
    new Request("http://localhost/api/pro-interest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        role: "ecommerce",
        monthlyVolume: "101-500",
        needs: ["批量处理提速", "平台主图模板"],
        contactChannel: "wechat",
        contact: "sample_wechat",
        note: "服装商品图",
        source: "pricing-test",
      }),
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      DB: {
        prepare: statement,
        async batch(statements) {
          for (const item of statements) await item.run();
          return [];
        },
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(executed.length, 3);
  assert.match(executed[2].sql, /INSERT INTO pro_interests/);
  assert.equal(executed[2].values[0], "sample_wechat");
});

test("registers, logs in and logs out with a D1-backed session", async () => {
  const worker = await loadWorker("account");
  const executed = [];
  let storedUser = null;
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              if (/FROM auth_rate_limits/.test(sql)) return null;
              if (/SELECT id FROM users/.test(sql)) return null;
              if (/password_hash AS passwordHash/.test(sql)) return storedUser;
              return null;
            },
            async run() {
              executed.push({ sql, values });
              if (/INSERT INTO users/.test(sql)) {
                storedUser = {
                  id: values[0],
                  email: values[1],
                  displayName: values[2],
                  passwordHash: values[3],
                  passwordSalt: values[4],
                  passwordIterations: values[5],
                  status: "active",
                };
              }
              return { success: true };
            },
          };
        },
      };
    },
  };
  const env = {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    DB: db,
  };
  const ctx = {
    waitUntil() {},
    passThroughOnException() {},
  };

  const registerResponse = await worker.fetch(
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
      },
      body: JSON.stringify({
        displayName: "电商运营小白",
        email: "SELLER@example.com",
        password: "Seller2026!",
      }),
    }),
    env,
    ctx,
  );

  assert.equal(registerResponse.status, 201);
  assert.deepEqual(await registerResponse.json(), { ok: true });
  assert.match(registerResponse.headers.get("set-cookie") ?? "", /bcp_session=/);
  assert.equal(storedUser.email, "seller@example.com");
  assert.equal(storedUser.displayName, "电商运营小白");
  assert.ok(storedUser.passwordHash);
  assert.notEqual(storedUser.passwordHash, "Seller2026!");

  const loginResponse = await worker.fetch(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
      },
      body: JSON.stringify({
        email: "seller@example.com",
        password: "Seller2026!",
      }),
    }),
    env,
    ctx,
  );
  assert.equal(loginResponse.status, 200);
  assert.deepEqual(await loginResponse.json(), { ok: true });
  assert.match(loginResponse.headers.get("set-cookie") ?? "", /HttpOnly/);

  const sessionCookie = loginResponse.headers
    .get("set-cookie")
    ?.match(/bcp_session=([^;]+)/)?.[1];
  assert.ok(sessionCookie);
  const logoutResponse = await worker.fetch(
    new Request("http://localhost/api/auth/logout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `bcp_session=${sessionCookie}`,
        origin: "http://localhost",
      },
      body: "{}",
    }),
    env,
    ctx,
  );
  assert.equal(logoutResponse.status, 200);
  assert.match(logoutResponse.headers.get("set-cookie") ?? "", /Max-Age=0/);
  assert.ok(executed.some(({ sql }) => /INSERT INTO users/.test(sql)));
  assert.ok(executed.some(({ sql }) => /INSERT INTO sessions/.test(sql)));
});

test("payment routes fail closed and degrade safely when Stripe is unavailable", async () => {
  const worker = await loadWorker("payment-configuration");
  const ctx = {
    waitUntil() {},
    passThroughOnException() {},
  };
  const assets = { fetch: async () => new Response("Not found", { status: 404 }) };

  const anonymousResponse = await worker.fetch(
    new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost" },
      body: JSON.stringify({ plan: "pro" }),
    }),
    { ASSETS: assets, DB: {} },
    ctx,
  );
  assert.equal(anonymousResponse.status, 401);
  assert.deepEqual(await anonymousResponse.json(), { ok: false, code: "AUTH_REQUIRED" });

  const sessionDb = {
    prepare(sql) {
      return {
        bind() {
          return {
            async first() {
              if (/FROM sessions/.test(sql)) {
                return {
                  id: "user_payment_test",
                  email: "seller@example.com",
                  displayName: "Seller",
                  plan: "free",
                };
              }
              return null;
            },
          };
        },
      };
    },
  };
  const partialConfigurationResponse = await worker.fetch(
    new Request("http://localhost/api/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "bcp_session=test-session",
        origin: "http://localhost",
      },
      body: JSON.stringify({ plan: "pro" }),
    }),
    { ASSETS: assets, DB: sessionDb, STRIPE_SECRET_KEY: "sk_test_config_only" },
    ctx,
  );
  assert.equal(partialConfigurationResponse.status, 503);
  assert.deepEqual(await partialConfigurationResponse.json(), {
    ok: false,
    code: "PAYMENT_CONFIG_INCOMPLETE",
  });

  const partialPortalResponse = await worker.fetch(
    new Request("http://localhost/api/billing-portal", {
      method: "POST",
      headers: { cookie: "bcp_session=test-session", origin: "http://localhost" },
    }),
    { ASSETS: assets, DB: sessionDb, STRIPE_SECRET_KEY: "sk_test_config_only" },
    ctx,
  );
  assert.equal(partialPortalResponse.status, 503);
  assert.deepEqual(await partialPortalResponse.json(), {
    ok: false,
    code: "PAYMENT_CONFIG_INCOMPLETE",
  });

  const webhookResponse = await worker.fetch(
    new Request("http://localhost/api/webhook", { method: "POST", body: "{}" }),
    { ASSETS: assets, DB: {} },
    ctx,
  );
  assert.equal(webhookResponse.status, 503);
  assert.deepEqual(await webhookResponse.json(), {
    ok: false,
    code: "PAYMENT_NOT_CONFIGURED",
  });
});

test("checkout explicitly enables Managed Payments", async () => {
  const worker = await loadWorker("managed-payments-checkout");
  const executed = [];
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              if (/FROM sessions/.test(sql)) {
                return {
                  id: "user_managed_payments",
                  email: "seller@example.com",
                  displayName: "Seller",
                  plan: "free",
                };
              }
              return null;
            },
            async run() {
              executed.push({ sql, values });
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
  };
  const nativeFetch = globalThis.fetch;
  let checkoutParams;
  globalThis.fetch = async (input, init) => {
    if (String(input).includes("/v1/checkout/sessions")) {
      checkoutParams = new URLSearchParams(String(init?.body ?? ""));
      return Response.json({
        id: "cs_test_managed_payments",
        object: "checkout.session",
        amount_total: 3900,
        currency: "cny",
        url: "https://checkout.stripe.com/c/pay/cs_test_managed_payments",
      });
    }
    return nativeFetch(input, init);
  };

  let response;
  try {
    response = await worker.fetch(
      new Request("http://localhost/api/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: "bcp_session=test-session",
          origin: "http://localhost",
        },
        body: JSON.stringify({
          plan: "pro",
          locale: "en",
          requestId: "managed-payment-test",
        }),
      }),
      {
        ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
        DB: db,
        STRIPE_SECRET_KEY: "sk_test_managed_payments",
        STRIPE_WEBHOOK_SECRET: "whsec_managed_payments",
        STRIPE_PRICE_PRO: "price_pro_test",
        STRIPE_PRICE_TEAM: "price_team_test",
      },
      { waitUntil() {}, passThroughOnException() {} },
    );
  } finally {
    globalThis.fetch = nativeFetch;
  }

  assert.equal(response.status, 200);
  assert.equal(checkoutParams?.get("mode"), "subscription");
  assert.equal(checkoutParams?.get("managed_payments[enabled]"), "true");
  assert.equal(checkoutParams?.get("line_items[0][price]"), "price_pro_test");
  assert.ok(executed.some(({ sql }) => /INSERT INTO orders/.test(sql)));
});

test("aggregates Cloudflare HTTP requests without storing query strings or IP addresses", async () => {
  const worker = await loadWorker("http-request-analytics");
  const executed = [];
  const pending = [];
  const db = {
    prepare(sql) {
      const statement = {
        values: [],
        bind(...values) {
          statement.values = values;
          return statement;
        },
        async first() {
          return null;
        },
        async run() {
          executed.push({ sql, values: statement.values });
          return { success: true };
        },
      };
      return statement;
    },
  };

  const response = await worker.fetch(
    new Request("https://edit-photo.com/api/account?token=must-not-be-stored", {
      headers: {
        accept: "application/json",
        "cf-ray": "request-test",
        "cf-connecting-ip": "203.0.113.42",
      },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      DB: db,
    },
    {
      waitUntil(promise) { pending.push(promise); },
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 401);
  await Promise.all(pending);
  assert.equal(executed.length, 1);
  assert.match(executed[0].sql, /INSERT INTO http_request_daily/);
  assert.deepEqual(executed[0].values.slice(1, 4), ["/api/account", "GET", 401]);
  const storedValues = JSON.stringify(executed[0].values);
  assert.doesNotMatch(storedValues, /must-not-be-stored/);
  assert.doesNotMatch(storedValues, /203\.0\.113\.42/);
});

test("billing portal is authenticated and bound to the current user's Stripe customer", async () => {
  const worker = await loadWorker("billing-portal-customer-binding");
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const assets = { fetch: async () => new Response("Not found", { status: 404 }) };
  const anonymousResponse = await worker.fetch(
    new Request("http://localhost/api/billing-portal", { method: "POST" }),
    { ASSETS: assets, DB: {} },
    ctx,
  );
  assert.equal(anonymousResponse.status, 401);

  const queriedUserIds = [];
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              if (/FROM sessions/.test(sql)) {
                return {
                  id: "user_billing_portal",
                  email: "billing@example.com",
                  displayName: "Billing User",
                  plan: "pro",
                };
              }
              if (/stripe_customer_id FROM subscriptions/.test(sql)) {
                queriedUserIds.push(values[0]);
                return { stripe_customer_id: "cus_current_user" };
              }
              return null;
            },
          };
        },
      };
    },
  };
  const nativeFetch = globalThis.fetch;
  let portalParams;
  globalThis.fetch = async (input, init) => {
    if (String(input).includes("/v1/billing_portal/sessions")) {
      portalParams = new URLSearchParams(String(init?.body ?? ""));
      return Response.json({
        id: "bps_test_current_user",
        object: "billing_portal.session",
        url: "https://billing.stripe.com/p/session/test",
      });
    }
    return nativeFetch(input, init);
  };

  let response;
  try {
    response = await worker.fetch(
      new Request("http://localhost/api/billing-portal", {
        method: "POST",
        headers: { cookie: "bcp_session=test-session", origin: "http://localhost" },
      }),
      {
        ASSETS: assets,
        DB: db,
        STRIPE_SECRET_KEY: "sk_test_billing_portal",
        STRIPE_WEBHOOK_SECRET: "whsec_billing_portal",
        STRIPE_PRICE_PRO: "price_pro_test",
        STRIPE_PRICE_TEAM: "price_team_test",
      },
      ctx,
    );
  } finally {
    globalThis.fetch = nativeFetch;
  }

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    url: "https://billing.stripe.com/p/session/test",
  });
  assert.deepEqual(queriedUserIds, ["user_billing_portal"]);
  assert.equal(portalParams?.get("customer"), "cus_current_user");
  assert.equal(portalParams?.get("return_url"), "http://localhost/account");
});

test("billing portal fails closed when the signed-in user has no Stripe subscription", async () => {
  const worker = await loadWorker("billing-portal-no-subscription");
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const db = {
    prepare(sql) {
      return {
        bind() {
          return {
            async first() {
              if (/FROM sessions/.test(sql)) {
                return {
                  id: "user_without_subscription",
                  email: "free@example.com",
                  displayName: "Free User",
                  plan: "free",
                };
              }
              return null;
            },
          };
        },
      };
    },
  };
  const response = await worker.fetch(
    new Request("http://localhost/api/billing-portal", {
      method: "POST",
      headers: { cookie: "bcp_session=test-session", origin: "http://localhost" },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      DB: db,
      STRIPE_SECRET_KEY: "sk_test_billing_portal",
      STRIPE_WEBHOOK_SECRET: "whsec_billing_portal",
      STRIPE_PRICE_PRO: "price_pro_test",
      STRIPE_PRICE_TEAM: "price_team_test",
    },
    ctx,
  );
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { ok: false, code: "SUBSCRIPTION_NOT_FOUND" });
});

test("credit consumption is atomic when requests reach the quota together", async () => {
  const worker = await loadWorker("payment-credit-atomicity");
  let used = 19;
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              if (/FROM sessions/.test(sql)) {
                return {
                  id: "user_credit_test",
                  email: "seller@example.com",
                  displayName: "Seller",
                  plan: "free",
                };
              }
              if (/INSERT INTO credit_usage/.test(sql)) {
                const count = values[2];
                const limit = values[6];
                if (used + count > limit) return null;
                used += count;
                return { used };
              }
              if (/SELECT used FROM credit_usage/.test(sql)) return { used };
              return null;
            },
          };
        },
      };
    },
  };
  const consume = () =>
    worker.fetch(
      new Request("http://localhost/api/credits/consume", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: "bcp_session=test-session",
          origin: "http://localhost",
        },
        body: JSON.stringify({ count: 1 }),
      }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, DB: db },
      { waitUntil() {}, passThroughOnException() {} },
    );

  const responses = await Promise.all([consume(), consume()]);
  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [200, 429],
  );
  assert.equal(used, 20);
  const rejected = responses.find((response) => response.status === 429);
  assert.equal((await rejected.json()).code, "QUOTA_EXCEEDED");
});

test("subscription webhooks use current Stripe state when events arrive out of order", async () => {
  const worker = await loadWorker("payment-subscription-status");
  const webhookSecret = "whsec_payment_policy_test";
  const stripe = new Stripe("sk_test_payment_policy");
  const event = {
    id: "evt_subscription_past_due",
    object: "event",
    type: "customer.subscription.updated",
    data: {
      object: {
        id: "sub_payment_policy",
        object: "subscription",
        customer: "cus_payment_policy",
        status: "active",
        metadata: { userId: "user_payment_policy", plan: "pro" },
        cancel_at_period_end: false,
        canceled_at: null,
        items: {
          data: [
            {
              current_period_start: 1_780_000_000,
              current_period_end: 1_782_592_000,
            },
          ],
        },
      },
    },
  };
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });
  const executed = [];
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            sql,
            values,
            async run() {
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
    async batch(statements) {
      executed.push(...statements);
      return statements.map(() => ({ success: true }));
    },
  };

  const nativeFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    if (String(input).includes("/v1/subscriptions/sub_payment_policy")) {
      return Response.json({
        ...event.data.object,
        status: "past_due",
      });
    }
    return nativeFetch(input, init);
  };

  let response;
  try {
    response = await worker.fetch(
      new Request("http://localhost/api/webhook", {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: payload,
      }),
      {
        ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
        DB: db,
        STRIPE_SECRET_KEY: "sk_test_payment_policy",
        STRIPE_WEBHOOK_SECRET: webhookSecret,
        STRIPE_PRICE_PRO: "price_pro_test",
        STRIPE_PRICE_TEAM: "price_team_test",
      },
      { waitUntil() {}, passThroughOnException() {} },
    );
  } finally {
    globalThis.fetch = nativeFetch;
  }

  assert.equal(response.status, 200);
  const userPlanUpdate = executed.find(({ sql }) => /UPDATE users SET plan/.test(sql));
  assert.ok(userPlanUpdate);
  assert.equal(userPlanUpdate.values[0], "free");

  executed.length = 0;
  const checkoutEvent = {
    id: "evt_checkout_unpaid",
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_checkout_unpaid",
        object: "checkout.session",
        client_reference_id: "user_payment_policy",
        metadata: { userId: "user_payment_policy", plan: "pro" },
        payment_status: "unpaid",
        payment_intent: null,
      },
    },
  };
  const checkoutPayload = JSON.stringify(checkoutEvent);
  const checkoutSignature = stripe.webhooks.generateTestHeaderString({
    payload: checkoutPayload,
    secret: webhookSecret,
  });
  const checkoutResponse = await worker.fetch(
    new Request("http://localhost/api/webhook", {
      method: "POST",
      headers: { "stripe-signature": checkoutSignature },
      body: checkoutPayload,
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      DB: db,
      STRIPE_SECRET_KEY: "sk_test_payment_policy",
      STRIPE_WEBHOOK_SECRET: webhookSecret,
      STRIPE_PRICE_PRO: "price_pro_test",
      STRIPE_PRICE_TEAM: "price_team_test",
    },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(checkoutResponse.status, 200);
  assert.equal(
    executed.some(({ sql }) => /UPDATE users SET plan/.test(sql)),
    false,
  );
  const pendingOrderUpdate = executed.find(({ sql }) => /UPDATE orders SET status/.test(sql));
  assert.ok(pendingOrderUpdate);
  assert.equal(pendingOrderUpdate.values[0], "pending");
});

test("duplicate Stripe webhook events are acknowledged without applying membership twice", async () => {
  const worker = await loadWorker("payment-webhook-idempotency");
  const webhookSecret = "whsec_idempotency_test";
  const stripe = new Stripe("sk_test_idempotency");
  const event = {
    id: "evt_checkout_duplicate",
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_checkout_duplicate",
        object: "checkout.session",
        client_reference_id: "user_idempotency",
        metadata: { userId: "user_idempotency", plan: "pro" },
        payment_status: "paid",
        payment_intent: "pi_idempotency",
      },
    },
  };
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });
  let eventInsertAttempts = 0;
  let membershipUpdates = 0;
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            sql,
            values,
            async run() {
              if (/INSERT OR IGNORE INTO processed_webhook_events/.test(sql)) {
                eventInsertAttempts += 1;
                return { meta: { changes: eventInsertAttempts === 1 ? 1 : 0 } };
              }
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
    async batch(statements) {
      membershipUpdates += statements.filter(({ sql }) => /UPDATE users SET plan/.test(sql)).length;
      return statements.map(() => ({ success: true }));
    },
  };
  const env = {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    DB: db,
    STRIPE_SECRET_KEY: "sk_test_idempotency",
    STRIPE_WEBHOOK_SECRET: webhookSecret,
    STRIPE_PRICE_PRO: "price_pro_test",
    STRIPE_PRICE_TEAM: "price_team_test",
  };
  const makeRequest = () =>
    new Request("http://localhost/api/webhook", {
      method: "POST",
      headers: { "stripe-signature": signature },
      body: payload,
    });

  const firstResponse = await worker.fetch(makeRequest(), env, {
    waitUntil() {},
    passThroughOnException() {},
  });
  const duplicateResponse = await worker.fetch(makeRequest(), env, {
    waitUntil() {},
    passThroughOnException() {},
  });

  assert.equal(firstResponse.status, 200);
  assert.deepEqual(await firstResponse.json(), { received: true });
  assert.equal(duplicateResponse.status, 200);
  assert.deepEqual(await duplicateResponse.json(), { received: true, duplicate: true });
  assert.equal(eventInsertAttempts, 2);
  assert.equal(membershipUpdates, 1);
});
