const { workerData } = require("worker_threads");

console.log("hello");

console.log(workerData);

parentPort.postMessage("hello");
