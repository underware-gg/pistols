import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/abi/index.ts",
    "src/dojo/index.ts",
    "src/fix/index.ts",
    "src/games/index.ts",
    "src/games/pistols/index.ts",
    "src/hooks/index.ts",
    "src/utils/index.ts"
  ],
  clean: true,
  format: ["cjs", "esm"],
  dts: true,
});
