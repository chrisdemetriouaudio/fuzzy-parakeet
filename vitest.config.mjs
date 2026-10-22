// Worker tests that run inside the Workers runtime, with a local D1 database that has
// every migration applied. `npm test` runs these after the plain Node tests.
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  const migrations = await readD1Migrations("migrations");
  return {
    plugins: [
      cloudflareTest({
        miniflare: {
          compatibilityDate: "2026-10-01",
          d1Databases: ["DB"],
          bindings: { TEST_MIGRATIONS: migrations },
        },
      }),
    ],
    test: {
      include: ["worker/spec/**/*.spec.js"],
      setupFiles: ["worker/spec/setup.js"],
    },
  };
});
