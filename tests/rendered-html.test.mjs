import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "test",
    `${process.pid}-${Date.now()}-${pathname}`,
  );
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
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
  assert.doesNotMatch(html, /codex-preview|Building your site/);
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
