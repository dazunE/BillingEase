import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships a WebAssembly build of Postgres; load it from node_modules at runtime.
  serverExternalPackages: ["@electric-sql/pglite"],
  // Lets end-to-end tests drive the dev server via 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
