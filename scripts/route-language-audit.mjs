const routes = [
  "/en",
  "/zh",
  "/en/batch",
  "/en/auth?mode=login",
  "/en/forgot-password",
  "/en/pricing",
  "/en/blog",
  "/en/contact",
  "/en/privacy",
  "/en/blog/product-photo-tips",
  "/en/blog/transparent-png-guide",
  "/en/blog/ecommerce-image-specs",
  "/en/disclaimer",
];

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("audit", String(Date.now()));
const worker = (await import(workerUrl.href)).default;

for (const pathname of routes) {
  const response = await worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      DB: {},
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
  const html = await response.text();
  const hanCount = Array.from(html).filter((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint >= 0x4e00 && codePoint <= 0x9fff;
  }).length;
  const language = html.includes('<html lang="zh-CN"')
    ? "zh-CN"
    : html.includes('<html lang="en"')
      ? "en"
      : "missing";

  console.log(
    JSON.stringify({ pathname, status: response.status, language, hanCount }),
  );
}
