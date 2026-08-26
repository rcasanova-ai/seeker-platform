import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "integrations/**/*.test.ts", "examples/**/*.test.ts"]
  }
});
