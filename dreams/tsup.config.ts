import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/hello.ts",
    "src/bots/",
  ],
  format: ["esm"],
  clean: true,
  dts: true,
});
