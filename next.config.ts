import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output: the build traces its own runtime files so the Docker
  // runner stage ships ~50MB of app instead of the full node_modules tree.
  output: "standalone"
};

export default nextConfig;
