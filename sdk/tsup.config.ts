import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/exports/index.ts",
    "src/exports/abis.ts",
    "src/exports/api.ts",
    "src/exports/dojo.ts",
    "src/exports/dojo_graphql.ts",
    "src/exports/dojo_sql.ts",
    "src/exports/fix.ts",
    "src/exports/hooks.ts",
    "src/exports/pistols.ts",
    "src/exports/pistols_cached.ts",
    "src/exports/pistols_config.ts",
    "src/exports/pistols_components.ts",
    "src/exports/pistols_constants.ts",
    "src/exports/pistols_dojo.ts",
    "src/exports/pistols_gen.ts",
    "src/exports/pistols_node.ts",
    "src/exports/pistols_sdk.ts",
    "src/exports/pistols_tokens.ts",
    "src/exports/starknet.ts",
    "src/exports/starknet_components.ts",
    "src/exports/utils.ts",
    "src/exports/utils_hooks.ts"
  ],
  format: ["esm"],
  clean: true,
  dts: true,
});
