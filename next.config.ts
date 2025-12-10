import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@hcl-cdp-ta/geofence-sdk"],
  // Fix for Turbopack + npm link in Next.js 16
  // Tells Turbopack to look in parent directory for symlinked packages
  outputFileTracingRoot: path.join(__dirname, "../"),
  // Empty turbopack config to silence webpack/turbopack warning
  turbopack: {},
  // Webpack config for symlinks (fallback if --webpack flag is used)
  webpack: config => {
    config.resolve.symlinks = true
    return config
  },
}

export default nextConfig
