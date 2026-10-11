import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 180000,
  expect: { timeout: 45000 },
  workers: 1,
  use: {
    browserName: 'chromium',
    viewport: { width: 1600, height: 1100 },
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {},
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'app', testMatch: 'unit01.spec.js', use: { baseURL: 'http://127.0.0.1:4173/x86-64-CSIS-118/' } },
    { name: 'production', testMatch: 'production.spec.js', use: { baseURL: 'http://127.0.0.1:4174/x86-64-CSIS-118/' } },
  ],
  webServer: [
    { command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort', url: 'http://127.0.0.1:4173/x86-64-CSIS-118/', reuseExistingServer: !process.env.CI },
    { command: 'npm run preview -- --host 127.0.0.1 --port 4174 --strictPort', url: 'http://127.0.0.1:4174/x86-64-CSIS-118/', reuseExistingServer: !process.env.CI },
  ],
});
