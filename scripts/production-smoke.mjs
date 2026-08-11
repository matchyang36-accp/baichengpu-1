const origin = process.env.SITE_ORIGIN ?? "https://edit-photo.com";
const requestTimeoutMs = 15_000;

const checks = [
  { path: "/en", status: 200, marker: "What is a local AI background remover" },
  {
    path: "/zh",
    status: 200,
    marker: "\u4ec0\u4e48\u662f\u6d4f\u89c8\u5668\u672c\u5730 AI \u62a0\u56fe",
  },
  { path: "/en/batch", status: 200, marker: "Batch" },
  {
    path: "/en/pricing",
    status: 200,
    marker: "Remove repetitive image work first",
  },
  { path: "/en/auth?mode=login", status: 200, marker: "Sign in" },
  { path: "/en/forgot-password", status: 200, marker: "verification" },
  { path: "/admin/login", status: 200, marker: "Admin" },
  { path: "/en/blog/ecommerce-image-specs", status: 200, marker: "Amazon" },
  { path: "/en/disclaimer", status: 200, marker: "No guarantee of results" },
  { path: "/sitemap.xml", status: 200, marker: "<urlset" },
  {
    path: "/robots.txt",
    status: 200,
    marker: "Sitemap: https://edit-photo.com/sitemap.xml",
  },
  { path: "/bg-removal/resources.json", status: 200, marker: "isnet" },
];

let failures = 0;

async function checkPage({ path, status, marker }) {
  try {
    const response = await fetch(new URL(path, origin), {
      redirect: "manual",
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
    const body = await response.text();
    const passed = response.status === status && body.includes(marker);
    console.log(`${passed ? "PASS" : "FAIL"} ${path} (${response.status})`);
    if (!passed) failures += 1;
  } catch (reason) {
    failures += 1;
    console.error(`FAIL ${path} (network error)`, reason);
  }
}

async function runCheck(label, check) {
  try {
    const { passed, status } = await check();
    console.log(`${passed ? "PASS" : "FAIL"} ${label} (${status})`);
    if (!passed) failures += 1;
  } catch (reason) {
    failures += 1;
    console.error(`FAIL ${label} (network error)`, reason);
  }
}

await Promise.all([
  ...checks.map(checkPage),
  runCheck("/admin anonymous protection", async () => {
    const response = await fetch(new URL("/admin", origin), {
      redirect: "manual",
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
    return {
      passed:
        response.status === 302 &&
        response.headers.get("location")?.includes("/admin/login"),
      status: response.status,
    };
  }),
  runCheck("/api/checkout anonymous protection", async () => {
    const response = await fetch(new URL("/api/checkout", origin), {
      method: "POST",
      redirect: "manual",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ plan: "pro" }),
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
    const body = await response.json().catch(() => null);
    return {
      passed: response.status === 401 && body?.code === "AUTH_REQUIRED",
      status: response.status,
    };
  }),
]);

if (failures > 0) process.exitCode = 1;
