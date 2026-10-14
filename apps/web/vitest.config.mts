import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src"), "server-only": path.resolve(__dirname, "tests/support/server-only.ts") } },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    env: { PGLITE_DIR: "memory://", BILLINGEASE_TODAY: "2026-10-04" },
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
