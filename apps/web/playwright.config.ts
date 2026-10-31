import { defineConfig, devices } from "@playwright/test";

// End-to-end journeys against the real API and web app, with a throwaway in-memory
// database and "today" fixed at 2026-10-11.
const API = 4200;
const WEB = 3200;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 180_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${WEB}`,
    trace: "retain-on-failure",
    // Use a locally installed Chromium if PLAYWRIGHT_CHROMIUM is set.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npx tsx src/server.ts",
      cwd: "../api",
      url: `http://127.0.0.1:${API}/health`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: { PGLITE_DIR: "memory://", BILLINGEASE_TODAY: "2026-10-11", FX_RATES: "off", API_PORT: String(API), APP_URL: `http://127.0.0.1:${WEB}`, STORAGE_DIR: ".data/e2e-files" },
    },
    {
      command: `npx next dev -p ${WEB}`,
      url: `http://127.0.0.1:${WEB}/sign-in`,
      timeout: 180_000,
      reuseExistingServer: false,
      env: { API_URL: `http://127.0.0.1:${API}`, BILLINGEASE_TODAY: "2026-10-11" },
    },
  ],
});
