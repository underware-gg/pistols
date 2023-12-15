
// const withTM = require('next-transpile-modules')(['somemodule', 'and-another']) // pass the modules you would like to see transpiled

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    SERVER_URL: process.env.SERVER_URL ?? '',
  },
  reactStrictMode: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    return config
  },
  async rewrites() {
    return [
      {
        source: '/gate',
        destination: '/main/gate',
      },
      {
        source: '/tavern',
        destination: '/main/tavern',
      },
      {
        source: '/duel/:slug*',
        destination: '/main/duel/:slug*',
      },
    ]
  },
}

export default nextConfig
