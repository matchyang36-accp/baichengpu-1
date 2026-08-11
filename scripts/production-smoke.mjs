const origin = process.env.SITE_ORIGIN ?? "https://edit-photo.com";

const checks = [
  ["/", 200, "Clean product photos"],
  ["/batch", 200, "批量"],
  ["/auth?mode=login", 200, "登录"],
  ["/forgot-password", 200, "验证码"],
  ["/admin/login", 200, "管理员"],
  ["/bg-removal/resources.json", 200, "isnet"],
];

let failures = 0;
for (const [path, expectedStatus, marker] of checks) {
  const response = await fetch(new URL(path, origin), { redirect: "manual" });
  const body = await response.text();
  const passed = response.status === expectedStatus && body.includes(marker);
  console.log(`${passed ? "PASS" : "FAIL"} ${path} (${response.status})`);
  if (!passed) failures += 1;
}

const protectedResponse = await fetch(new URL("/admin", origin), {
  redirect: "manual",
});
const protectedPassed =
  protectedResponse.status === 302 &&
  protectedResponse.headers.get("location")?.includes("/admin/login");
console.log(
  `${protectedPassed ? "PASS" : "FAIL"} /admin anonymous protection (${protectedResponse.status})`,
);
if (!protectedPassed) failures += 1;

if (failures > 0) process.exitCode = 1;
