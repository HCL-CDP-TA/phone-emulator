import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@hcl-cdp-ta/geofence-sdk"],
  serverExternalPackages: ["@hcl-cdp-ta/cdp-node-sdk"],
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
