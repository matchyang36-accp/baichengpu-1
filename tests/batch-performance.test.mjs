import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";
import fs from "node:fs/promises";

async function loadModule() {
  const source = await fs.readFile(
    new URL("../app/lib/batch-performance.ts", import.meta.url),
    "utf8",
  );
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const commonJsModule = { exports: {} };
  vm.runInNewContext(code, {
    module: commonJsModule,
    exports: commonJsModule.exports,
  });
  return commonJsModule.exports;
}

test("uses two batch tasks only on capable desktop devices", async () => {
  const { selectBatchConcurrency: select } = await loadModule();
  assert.equal(select(20, { hardwareConcurrency: 12, deviceMemory: 16 }), 2);
  assert.equal(select(20, { hardwareConcurrency: 8, deviceMemory: 8 }), 2);
  assert.equal(select(1, { hardwareConcurrency: 12, deviceMemory: 16 }), 1);
  assert.equal(select(20, { hardwareConcurrency: 4, deviceMemory: 16 }), 1);
  assert.equal(select(20, { hardwareConcurrency: 12, deviceMemory: 4 }), 1);
  assert.equal(
    select(20, { hardwareConcurrency: 12, deviceMemory: 16, mobile: true }),
    1,
  );
});

test("pool never exceeds the selected concurrency", async () => {
  const { runBatchPool } = await loadModule();
  let active = 0;
  let peak = 0;
  const completed = [];

  await runBatchPool([1, 2, 3, 4, 5], 2, async (item) => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    completed.push(item);
    active -= 1;
  });

  assert.equal(peak, 2);
  assert.deepEqual(completed.toSorted(), [1, 2, 3, 4, 5]);
});
