const required = {
  STRIPE_SECRET_KEY: /^sk_live_/,
  STRIPE_WEBHOOK_SECRET: /^whsec_/,
  STRIPE_PRICE_PRO: /^price_/,
  STRIPE_PRICE_TEAM: /^price_/,
};

const failures = [];
for (const [name, pattern] of Object.entries(required)) {
  const value = process.env[name]?.trim() ?? "";
  if (!value) failures.push(`${name} is missing`);
  else if (!pattern.test(value)) failures.push(`${name} has an invalid production prefix`);
}

const siteUrl = process.env.SITE_URL?.trim() ?? "";
if (siteUrl !== "https://edit-photo.com") {
  failures.push("SITE_URL must be exactly https://edit-photo.com");
}

if (failures.length) {
  console.error("[billing-preflight] BLOCKED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("[billing-preflight] READY");
  console.log("Production Stripe variable names and prefixes are valid. No secret values were printed.");
}
