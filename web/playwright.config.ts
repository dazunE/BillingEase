import { defineConfig, devices } from "@playwright/test";

// End-to-end test of the whole loop against a dev server with a throwaway
// in-memory database and a fixed "today".
const PORT = 3200;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    // Use a locally installed Chromium if PLAYWRIGHT_CHROMIUM is set.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/login`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: { PGLITE_DIR: "memory://", BILLINGEASE_TODAY: "2026-10-04", APP_URL: `http://127.0.0.1:${PORT}` },
  },
});
