import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['@duckdb/duckdb-wasm']
};

export default nextConfig;
