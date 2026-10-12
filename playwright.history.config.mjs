import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// Replit supplies a Chromium with its Nix runtime libraries. Elsewhere use
// Playwright's installed browser, unless an explicit executable is provided.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  || (existsSync('/repl/tools/bin/chromium') ? '/repl/tools/bin/chromium' : undefined);

export default defineConfig({
  testDir: './scripts/browser',
  testMatch: 'merch-refresh-history.spec.mjs',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: process.env.HISTORY_UI_BASE_URL || 'http://127.0.0.1:5000',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath },
  },
  outputDir: './generated-artifacts/history-ui',
  reporter: 'list',
  // Only Vite is needed: every API response is intercepted by the fixtures.
  webServer: process.env.HISTORY_UI_BASE_URL ? undefined : {
    command: 'npm exec vite -- --host 0.0.0.0 --port 5000',
    url: 'http://127.0.0.1:5000',
    reuseExistingServer: !process.env.CI,
  },
});
