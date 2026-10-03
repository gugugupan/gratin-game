/// <reference types="vitest/config" />
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: { port: 5190, strictPort: true },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        privacy: resolve(import.meta.dirname, "privacy/index.html"),
      },
    },
  },
  test: { include: ["tests/**/*.test.ts"] },
});
