import { defineConfig } from "vite";

export default defineConfig({
  root: __dirname,
  base: "./",
  server: { port: 5241, strictPort: true },
});
