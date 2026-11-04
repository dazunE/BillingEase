import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit tests for the app's plain logic (money, amounts, the API client). Screens are checked
// by running the app.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@billingease/contracts": path.resolve(__dirname, "../../packages/contracts/src/index.ts"),
      "@billingease/core": path.resolve(__dirname, "../../packages/core/src/index.ts"),
    },
  },
  test: { include: ["test/**/*.test.ts"] },
});
