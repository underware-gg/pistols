
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
    config.experiments = {
      asyncWebAssembly: true,
    }
    return config
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/main/gate',
      },
      {
        source: '/tavern/:slug*',
        destination: '/main/tavern/:slug*',
      },
      {
        source: '/duel/:slug*',
        destination: '/main/duel/:slug*',
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/gate',
        destination: '/',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
