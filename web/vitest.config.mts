import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    env: { PGLITE_DIR: "memory://", BILLINGEASE_TODAY: "2026-10-04" },
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
