import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@hcl-cdp-ta/geofence-sdk"],
}

export default nextConfig
