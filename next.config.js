/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  webpack: (config, { isServer }) => {
    config.resolve.alias['@content'] = require('path').join(__dirname, 'content')
    if (isServer) {
      // better-sqlite3 is a native module — exclude from client bundle
      config.externals = [...(config.externals || []), 'better-sqlite3']
    }
    return config
  }
}
module.exports = nextConfig
