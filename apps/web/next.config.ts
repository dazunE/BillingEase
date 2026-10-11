import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The shared packages are TypeScript source; Next compiles them with the app.
  transpilePackages: ["@billingease/contracts", "@billingease/core"],
  // A small self-contained server for the Docker image.
  output: "standalone",
  // Lets end-to-end tests drive the dev server via 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
