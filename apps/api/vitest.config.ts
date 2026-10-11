import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: { NODE_ENV: "test", BILLINGEASE_TODAY: "2026-10-11" },
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
