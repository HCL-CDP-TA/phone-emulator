import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@hcl-cdp-ta/geofence-sdk"],
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
