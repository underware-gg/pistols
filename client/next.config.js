
// const withTM = require('next-transpile-modules')(['somemodule', 'and-another']) // pass the modules you would like to see transpiled

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    SERVER_URL: process.env.SERVER_URL ?? '',
    PROFILE_PIC_COUNT: '13',
  },
  reactStrictMode: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    config.experiments = { asyncWebAssembly: true }
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
