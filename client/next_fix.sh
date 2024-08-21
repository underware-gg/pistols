export WASM_PACKAGE="./node_modules/.pnpm/@dojoengine+torii-wasm@1.0.0-alpha.6/node_modules/@dojoengine/torii-wasm/package.json"
ls -l $WASM_PACKAGE
sed -i '' -e 's/node/web/' $WASM_PACKAGE
ls -l $WASM_PACKAGE
