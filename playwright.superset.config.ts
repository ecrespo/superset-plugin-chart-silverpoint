import { defineConfig, devices } from '@playwright/test';

// SUP-REQ-011: the plugins inside a running Superset (docker/compose.yml), in Chromium.
export default defineConfig({
  testDir: 'test/superset',
  timeout: 120_000,
  use: { baseURL: process.env.SUPERSET_URL ?? 'http://localhost:8088/', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
});
