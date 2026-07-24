import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

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
          "var maxNumThreads = () => globalThis.crossOriginIsolated ? navigator.hardwareConcurrency ?? 4 : 1;",
        )
        .replace(
          `async function loadAsUrl(url, config) {
  return URL.createObjectURL(await loadAsBlob(url, config));
}`,
          `async function loadAsUrl(url, config) {
  const relativeUrl = url.replace(/^\\//, "");
  return new URL(relativeUrl, config.publicPath).toString();
}`,
        )
        .replace(
          `  const mjsPath = await loadAsUrl(\`\${baseFilePath}.mjs\`, config);
  ort2.env.wasm.wasmPaths = {
    mjs: mjsPath,
    wasm: wasmPath
  };`,
          `  ort2.env.wasm.wasmPaths = {
    wasm: wasmPath
  };`,
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

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      backgroundRemovalRuntimeCompat(),
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
