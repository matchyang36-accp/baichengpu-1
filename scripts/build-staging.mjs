import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const vinextCli = fileURLToPath(
  new URL("../node_modules/vinext/dist/cli.js", import.meta.url),
);
const result = spawnSync(process.execPath, [vinextCli, "build"], {
  env: {
    ...process.env,
    BAICHENGPU_DEPLOY_TARGET: "staging",
  },
  stdio: "inherit",
});

if (result.error) {
  console.error("[staging-build] SPAWN_FAILED", result.error);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
