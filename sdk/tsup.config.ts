import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/abi/index.ts",
    "src/hooks/index.ts",
    "src/utils/index.ts"
  ],
  clean: true,
  format: ["cjs", "esm"],
  dts: true,
});
