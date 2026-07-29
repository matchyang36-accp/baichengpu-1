import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/", requestHeaders = {}, db = {}) {
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
  assert.match(html, /<title>白橙铺｜商品图一键干净抠出<\/title>/);
  assert.match(html, /商品图，/);
  assert.match(html, /浏览器本地处理/);
  assert.match(html, /href="\/batch"/);
  assert.match(html, /href="\/pricing"/);
  assert.match(html, /href="\/privacy"/);
  assert.match(html, /注册/);
  assert.match(html, /登录/);
  assert.doesNotMatch(html, /codex-preview|Building your site/);
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
  assert.match(homeHtml, /我的账户/);
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

test("server-renders the independent registration page", async () => {
  const response = await render("/auth?mode=register&return_to=%2Faccount");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /创建账户/);
  assert.match(html, /免费注册/);
  assert.match(html, /原图和结果不上传服务器/);
});

test("server-renders the professional plan and privacy pages", async () => {
  const [pricingResponse, privacyResponse] = await Promise.all([
    render("/pricing"),
    render("/privacy"),
  ]);
  assert.equal(pricingResponse.status, 200);
  assert.equal(privacyResponse.status, 200);

  const [pricingHtml, privacyHtml] = await Promise.all([
    pricingResponse.text(),
    privacyResponse.text(),
  ]);

  assert.match(pricingHtml, /专业版内测/);
  assert.match(pricingHtml, /申请专业版内测/);
  assert.match(pricingHtml, /团队与定制/);
  assert.match(pricingHtml, /常见问题/);
  assert.match(pricingHtml, /目前批量体验版免费开放/);
  assert.match(pricingHtml, /专业版内测申请/);
  assert.match(pricingHtml, /提交内测申请/);

  assert.match(privacyHtml, /你的商品图片，留在你的设备里/);
  assert.match(privacyHtml, /原图和生成结果不会上传/);
  assert.match(privacyHtml, /模型文件与浏览器缓存/);
  assert.match(privacyHtml, /质量反馈/);
  assert.match(privacyHtml, /专业版内测申请/);
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
