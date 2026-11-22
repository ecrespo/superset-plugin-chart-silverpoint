import { defineConfig, devices } from '@playwright/test';

// SUP-T-07: the built plugins inside Superset's SuperChart, in Chromium.
export default defineConfig({
  testDir: 'test/e2e',
  use: { baseURL: 'http://localhost:4319/' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: 'npx vite e2e --port 4319 --strictPort', url: 'http://localhost:4319/index.html', reuseExistingServer: true },
});
