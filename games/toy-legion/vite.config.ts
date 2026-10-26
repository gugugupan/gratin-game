import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5285, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
});
