const { Worker, isMainThread, workerData } = require("node:worker_threads");
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

    // it is used to pass start_args.
    const shared = new SharedArrayBuffer(4);
    new Worker(__filename, { workerData: { shared, memory } });
    const instance = await WebAssembly.instantiate(wasm, {
      ...wasi.getImportObject(),
      wasi: {
        "thread-spawn": (arg) => {
          new Uint32Array(shared)[0] = arg;
        },
      },
      env: { memory },
    });
    wasi.start(instance);
  })();
} else {
  while (true) {
    if (new Uint32Array(workerData.shared)[0] !== 0) {
      break;
    }
  }

  (async () => {
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
    instance.exports.wasi_thread_start(
      1,
      new Uint32Array(workerData.shared)[0]
    );
  })();
}

//
