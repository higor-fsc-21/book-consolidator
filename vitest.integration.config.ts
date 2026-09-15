import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@/lib/db": path.resolve(
        import.meta.dirname,
        "./tests/integration/helpers/test-db.ts",
      ),
      "@": path.resolve(import.meta.dirname, "./src"),
      "server-only": path.resolve(
        import.meta.dirname,
        "./tests/support/server-only.ts",
      ),
      "next/cache": path.resolve(
        import.meta.dirname,
        "./tests/support/next-cache.ts",
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["./tests/integration/setup.ts"],
    testTimeout: 120000,
    hookTimeout: 120000,
    exclude: ["node_modules"],
  },
})
