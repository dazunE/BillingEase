import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The shared packages are TypeScript source; Next compiles them with the app.
  transpilePackages: ["@billingease/contracts", "@billingease/core"],
  // A small self-contained server for the Docker image.
  output: "standalone",
  // Lets end-to-end tests drive the dev server via 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1"],
  // OAuth and MCP clients look for metadata under /.well-known; a route handler forwards it.
  async rewrites() {
    return [{ source: "/.well-known/:path*", destination: "/well-known/:path*" }];
  },
  // The consent screen is never shown inside another site's frame.
  async headers() {
    return [{ source: "/oauth/authorize", headers: [{ key: "X-Frame-Options", value: "DENY" }, { key: "Content-Security-Policy", value: "frame-ancestors 'none'" }] }];
  },
};

export default nextConfig;
