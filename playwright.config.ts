import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:3017", screenshot: "only-on-failure", trace: "retain-on-failure" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }, { name: "mobile", use: { ...devices["Pixel 5"] } }],
  webServer: { command: "AUTH_SECRET='local-altora-market-development-only-not-for-production' DATABASE_URL='postgresql://icat@localhost:5432/altora_market_test' npm run start --workspace=@altora/market -- -p 3017", url: "http://127.0.0.1:3017/login", reuseExistingServer: false, timeout: 120_000 },
});
