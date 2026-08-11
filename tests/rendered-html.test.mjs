import assert from "node:assert/strict";
import test from "node:test";

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
  assert.match(chineseHtml, /<html lang="zh-CN">/);
  assert.match(chineseHtml, /免费 AI 抠图工具/);
  assert.match(chineseHtml, /href="\/zh\/batch"/);
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

  const loginResponse = await render("/admin/login");
  assert.equal(loginResponse.status, 200);
  const loginHtml = await loginResponse.text();
  assert.match(loginHtml, /登录管理后台/);
  assert.match(loginHtml, /644373212@qq\.com/);
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
  assert.match(adminHomeHtml, /href="\/admin\/analytics"/);
  assert.match(adminHomeHtml, /href="\/admin\/users"/);

  const analyticsResponse = await render(
    "/admin/analytics",
    authenticatedHeaders,
    sessionDb,
    { ADMIN_EMAILS: "admin@example.com" },
  );
  assert.equal(analyticsResponse.status, 200);
  const analyticsHtml = await analyticsResponse.text();
  assert.match(analyticsHtml, /访问分析/);
  assert.match(analyticsHtml, /最近访客/);
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
