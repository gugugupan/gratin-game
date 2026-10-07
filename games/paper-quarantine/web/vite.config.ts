import { defineConfig } from "vite";

export default defineConfig({
  root: __dirname,
  base: "./",
  publicDir: "public",
  server: { port: 5240, strictPort: true },
  build: {
    outDir: "../dist-web",
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
  },
});
