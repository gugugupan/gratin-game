/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: { port: 5190, strictPort: true },
  test: { include: ["tests/**/*.test.ts"] },
});
