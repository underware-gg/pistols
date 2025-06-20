import { defineConfig, UserConfig } from "vite";
import wasm from "vite-plugin-wasm";
import react from "@vitejs/plugin-react";
import topLevelAwait from "vite-plugin-top-level-await";
import glsl from "vite-plugin-glsl";

// https://vitejs.dev/config/
export const config: UserConfig = {
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    glsl({
      include: [
        '**/*.glsl',
        '**/*.wgsl',
        '**/*.vert',
        '**/*.frag',
        '**/*.vs',
        '**/*.fs'
      ],
      exclude: undefined,
      warnDuplicatedImports: true,
      defaultExtension: 'glsl',
      watch: true,
      root: '/'
    }),
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
