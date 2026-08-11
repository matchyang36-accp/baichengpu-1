import vinext from "vinext";
import { defineConfig } from "vite";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

function backgroundRemovalRuntimeCompat() {
  return {
    name: "background-removal-runtime-compat",
    enforce: "pre" as const,
    transform(code: string, id: string) {
      const normalizedId = id.replaceAll("\\", "/");
      if (
        !normalizedId.includes(
          "/@imgly/background-removal/dist/index.mjs",
        )
      ) {
        return null;
      }

      const patchedCode = code
        .replace(
          "var maxNumThreads = () => navigator.hardwareConcurrency ?? 4;",
          "var maxNumThreads = () => 1;",
        )
        .replace(
          'executionMode: "parallel"',
          'executionMode: "sequential"',
        )
        .replace(
          `async function loadAsUrl(url, config) {
  return URL.createObjectURL(await loadAsBlob(url, config));
}`,
          `async function loadAsUrl(url, config) {
  const relativeUrl = url.replace(/^\\//, "");
  return new URL(relativeUrl, config.publicPath).toString();
}`,
        );

      if (patchedCode === code) {
        throw new Error(
          "Unable to apply the background-removal runtime compatibility patch.",
        );
      }

      return { code: patchedCode, map: null };
    },
  };
}

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");
  const cloudflareConfigPath =
    process.env.BAICHENGPU_DEPLOY_TARGET === "staging"
      ? "wrangler.staging.jsonc"
      : undefined;

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      backgroundRemovalRuntimeCompat(),
      vinext(),
      cloudflare({
        configPath: cloudflareConfigPath,
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
      }),
    ],
  };
});
