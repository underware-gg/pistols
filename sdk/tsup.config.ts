import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/exports/index.ts",
    "src/exports/abis.ts",
    "src/exports/dojo.ts",
    "src/exports/dojo_graphql.ts",
    "src/exports/fix.ts",
    "src/exports/hooks.ts",
    "src/exports/pistols.ts",
    "src/exports/pistols_gen.ts",
    "src/exports/pistols_components.ts",
    "src/exports/pistols_controller.ts",
    "src/exports/pistols_tokens.ts",
    "src/exports/utils.ts",
    "src/exports/utils_hooks.ts",
    "src/exports/utils_starknet.ts"
  ],
  format: ["esm"],
  clean: true,
  dts: true,
});
