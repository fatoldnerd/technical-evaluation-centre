import { defineConfig } from "playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  use: { baseURL: "http://localhost:3017", headless: true },
  reporter: "list",
});
