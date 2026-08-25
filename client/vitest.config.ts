import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    // happy-dom rather than jsdom: 7 transitive dependencies against jsdom's 21,
    // and every package here has to pass the reviewed-set gate. React component
    // and hook tests need a DOM; the SDK stays on "node" because its tests are
    // pure functions.
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
