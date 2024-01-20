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

const wasi = new WASI({ version: "preview1", args: argv, env });

if (isMainThread) {
  (async () => {
    const wasm = await WebAssembly.compile(
      await readFile(join(__dirname, "wasi-threads.wasm"))
    );
    let memory = new WebAssembly.Memory({
      initial: 17,
      maximum: 17,
      shared: true,
    });

    const worker = new Worker(__filename, { workerData: { memory } });
    const instance = await WebAssembly.instantiate(wasm, {
      ...wasi.getImportObject(),
      wasi: {
        "thread-spawn": (arg) => {
          worker.postMessage(arg);
        },
      },
      env: { memory },
    });
    wasi.start(instance);
  })();
} else {
  parentPort.on("message", async (arg) => {
    const wasm = await WebAssembly.compile(
      await readFile(join(__dirname, "wasi-threads.wasm"))
    );
    const instance = await WebAssembly.instantiate(wasm, {
      ...wasi.getImportObject(),
      wasi: {
        "thread-spawn": (arg) => {
          // dummy
        },
      },
      env: { memory: workerData.memory },
    });
    instance.exports.wasi_thread_start(1, arg);
    process.exit(1);
  });
}

//
