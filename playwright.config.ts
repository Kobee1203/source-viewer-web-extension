import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  /* Run tests sequentially — a single persistent browser context with the extension loaded */
  fullyParallel: false,
  workers: 1,
  /* Reporter configuration */
  reporter: [['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
  },
  retries: 0,
  /* Auto-start the fixture server before tests */
  webServer: {
    command: 'tsx e2e/server/start.ts',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
