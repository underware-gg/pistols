import { defineConfig, UserConfig } from "vite";
import wasm from "vite-plugin-wasm";
import react from "@vitejs/plugin-react";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export const config: UserConfig = {
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: [
          'import',
          'global-builtin',
          'color-functions',
        ],
        quietDeps: true,
      },
    },
  },
};

export default defineConfig(config);
