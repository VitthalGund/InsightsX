import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['@duckdb/duckdb-wasm'],
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
