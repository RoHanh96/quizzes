import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://127.0.0.1:3005",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    /** Dùng `next start` để tránh `.next` dev lệch vendor chunk (vd. sonner). Cần đã `npm run build` trước khi chạy `npm run e2e` đơn lẻ; `npm run verify` đã build trước e2e. */
    command: "npm run start",
    url: "http://127.0.0.1:3005",
    env: { PORT: "3005" },
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
