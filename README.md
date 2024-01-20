```
cargo build --target wasm32-wasi-preview1-threads --release
cp target/wasm32-wasi-preview1-threads/release/wasi-threads.wasm wasi-threads.wasm
node index.js
```
