import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321',
    url: 'http://localhost:4321/ostov/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: 'http://localhost:4321' },
  projects: [
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
  ],
});
