const {
  Worker,
  isMainThread,
  workerData,
  parentPort,
} = require("node:worker_threads");
const { readFile } = require("node:fs/promises");
const { WASI } = require("wasi");
const { argv, env } = require("node:process");
const { join } = require("node:path");

const file = readFile(join(__dirname, "wasi-threads.wasm"));

const wasi = new WASI({ version: "preview1", args: argv, env });

if (isMainThread) {
  (async () => {
    const wasm = await WebAssembly.compile(await file);
    const opts = { initial: 17, maximum: 17, shared: true };
    const memory = new WebAssembly.Memory(opts);
    const instance = await WebAssembly.instantiate(wasm, {
      ...wasi.getImportObject(),
      wasi: {
        "thread-spawn": (arg) => {
          const worker = new Worker(__filename, { workerData: { memory } });
          worker.postMessage(arg);
        },
      },
      env: { memory },
    });
    wasi.start(instance);
  })();
} else {
  const handler = async (start_arg) => {
    try {
      const wasm = await WebAssembly.compile(await file);
      const { memory } = workerData;
      const instance = await WebAssembly.instantiate(wasm, {
        ...wasi.getImportObject(),
        wasi: {
          "thread-spawn": (arg) => {
            const worker = new Worker(__filename, { workerData: { memory } });
            worker.postMessage(arg);
          },
        },
        env: { memory },
      });
      // thread id and start_arg
      instance.exports.wasi_thread_start(1, start_arg);
      parentPort.removeListener("message", handler);
    } catch (e) {
      if (e.code.includes("ERR_WASI_NOT_STARTED")) {
        // NOP
        return;
      }
      throw e;
    } finally {
      process.exit(0);
    }
  };
  parentPort.addListener("message", handler);
}

