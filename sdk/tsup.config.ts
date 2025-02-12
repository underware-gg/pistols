import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/exports/index.ts",
    "src/exports/abis.ts",
    "src/exports/dojo.ts",
    "src/exports/fix.ts",
    "src/exports/games_pistols.ts",
    "src/exports/hooks.ts",
    "src/exports/utils.ts"
  ],
  clean: true,
  format: ["cjs", "esm"],
  dts: true,
});
