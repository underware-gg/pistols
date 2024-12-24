import { defineConfig, UserConfig } from "vite";
import mkcert from 'vite-plugin-mkcert'
import { config } from './vite.config';

let config_https: UserConfig = {
  ...config,
  plugins: [
    ...config.plugins,
    mkcert(),
  ],
};
export default defineConfig(config_https);
