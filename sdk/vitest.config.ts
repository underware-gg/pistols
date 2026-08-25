import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // The SDK imports itself as "src/..." via a tsconfig path alias. tsup and
      // tsc honour it; vitest did not, so any test importing a module that uses
      // the alias failed to resolve. The existing tests only used relative
      // imports, which is why this went unnoticed.
      src: fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    globals: true,
    // node by default: most of the suite is pure functions. Hook tests opt into a
    // DOM per file with `// @vitest-environment happy-dom`.
    environment: "node",
  },
});
