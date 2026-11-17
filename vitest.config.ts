import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Isolated-database tests start a throwaway Postgres in each file; when many
    // files run at once that boot can exceed Vitest's 10s default hook allowance.
    hookTimeout: 60000,
    testTimeout: 60000,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
